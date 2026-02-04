"""
Zine Delivery Job

Hourly job that checks which users are due for a delivery based on their
tempo preference, curates products matching their profile, and sends via SMTP.
"""

import logging
import smtplib
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from sqlalchemy import func

import config
from models.database import get_session
from models.user import User
from models.product import Product
from models.delivery import ZineDelivery

logger = logging.getLogger(__name__)

# Tempo -> interval mapping
TEMPO_INTERVALS = {
    "weekly": timedelta(days=7),
    "monthly": timedelta(days=30),
    "quarterly": timedelta(days=90),
}

MAX_PRODUCTS_PER_DELIVERY = 12


def get_due_users(session) -> list:
    """Find active users who are due for a zine delivery."""
    now = datetime.utcnow()
    due_users = []

    users = session.query(User).filter(User.is_active == True).all()  # noqa: E712

    for user in users:
        interval = TEMPO_INTERVALS.get(user.tempo, TEMPO_INTERVALS["monthly"])

        # Check last delivery
        last_delivery = (
            session.query(ZineDelivery)
            .filter(
                ZineDelivery.user_id == user.id,
                ZineDelivery.status.in_(["delivered", "generating", "pending"]),
            )
            .order_by(ZineDelivery.scheduled_at.desc())
            .first()
        )

        if last_delivery is None:
            # Never delivered — user is due
            due_users.append(user)
        elif (now - last_delivery.scheduled_at) >= interval:
            due_users.append(user)

    return due_users


def curate_products(session, user: User) -> list:
    """
    Select products matching a user's preferences using the matching engine.

    Scores products on aesthetic/palette/vibe alignment, then applies
    diversity rules for category and brand distribution.
    """
    from matching.curator import curate_zine

    zine = curate_zine(
        user_id=user.id,
        session=session,
        max_products=MAX_PRODUCTS_PER_DELIVERY,
    )

    return [rp.product for rp in zine.products]


def send_delivery_email(user: User, products: list) -> None:
    """Send a zine delivery email to the user via SMTP."""
    if not all([config.SMTP_HOST, config.SMTP_USER, config.SMTP_PASSWORD]):
        raise RuntimeError("SMTP not configured — set SMTP_HOST, SMTP_USER, SMTP_PASSWORD")

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Your Fashion Discovery Zine"
    msg["From"] = config.SMTP_USER
    msg["To"] = user.contact_value

    # Build product list HTML
    product_rows = []
    for p in products:
        product_rows.append(
            f'<tr><td style="padding:8px">'
            f'<a href="{p.url}">{p.name}</a></td>'
            f'<td style="padding:8px">{p.brand.name if p.brand else ""}</td>'
            f'<td style="padding:8px">${p.price:.2f}</td></tr>'
        )

    html = f"""
    <html>
    <body style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h1 style="border-bottom:2px solid #000;padding-bottom:12px">
            Your Zine — {datetime.utcnow().strftime('%B %Y')}
        </h1>
        <p>Hi {user.name}, here are your curated picks:</p>
        <table style="width:100%;border-collapse:collapse">
            <tr style="background:#f5f5f5">
                <th style="padding:8px;text-align:left">Product</th>
                <th style="padding:8px;text-align:left">Brand</th>
                <th style="padding:8px;text-align:left">Price</th>
            </tr>
            {''.join(product_rows)}
        </table>
        <p style="margin-top:24px;color:#666;font-size:12px">
            Fashion Discovery &mdash; curated for your style
        </p>
    </body>
    </html>
    """

    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP(config.SMTP_HOST, config.SMTP_PORT) as server:
        server.starttls()
        server.login(config.SMTP_USER, config.SMTP_PASSWORD)
        server.send_message(msg)


def run_delivery_job():
    """
    Main entry point for the hourly delivery job.

    For each due user:
    1. Create a pending ZineDelivery record
    2. Curate matching products
    3. Attempt delivery via email
    4. Update status to delivered or failed
    """
    logger.info("Starting zine delivery job")
    session = get_session()

    try:
        due_users = get_due_users(session)
        logger.info(f"Found {len(due_users)} users due for delivery")

        for user in due_users:
            delivery = ZineDelivery(
                user_id=user.id,
                scheduled_at=datetime.utcnow(),
                status="pending",
                delivery_method=user.contact_method,
                delivery_address=user.contact_value,
            )
            session.add(delivery)
            session.flush()

            try:
                delivery.status = "generating"
                session.flush()

                products = curate_products(session, user)
                delivery.product_ids = [p.id for p in products]

                if not products:
                    delivery.status = "delivered"
                    delivery.delivered_at = datetime.utcnow()
                    delivery.error = "No matching products found"
                    logger.info(f"No products for user {user.id}, marking delivered (empty)")
                    session.commit()
                    continue

                if user.contact_method == "email":
                    send_delivery_email(user, products)

                delivery.status = "delivered"
                delivery.delivered_at = datetime.utcnow()
                session.commit()
                logger.info(
                    f"Delivered zine to user {user.id} with {len(products)} products"
                )

            except Exception as e:
                delivery.status = "failed"
                delivery.error = str(e)
                session.commit()
                logger.error(f"Failed delivery for user {user.id}: {e}")

    except Exception as e:
        logger.error(f"Delivery job failed: {e}")
        session.rollback()
    finally:
        session.close()

    logger.info("Zine delivery job complete")


def schedule_delivery_job(scheduler):
    """Register the delivery job with APScheduler to run hourly."""
    scheduler.add_job(
        run_delivery_job,
        "interval",
        hours=1,
        id="zine_delivery",
        name="Zine Delivery Job",
        replace_existing=True,
    )
    logger.info("Scheduled zine delivery job (hourly)")
