"""
Scraper Scheduler

Manages scheduled scraping jobs using APScheduler.
"""

from datetime import datetime
from typing import Callable, Dict, List, Optional

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

from utils.logger import get_logger

logger = get_logger(__name__)


class ScraperScheduler:
    """
    Scheduler for running scrape jobs on a schedule.

    Supports both interval-based and cron-based scheduling.

    Usage:
        scheduler = ScraperScheduler()

        # Run every 6 hours
        scheduler.add_interval_job("pompeii", scrape_brand, hours=6)

        # Run at 3am daily
        scheduler.add_cron_job("ald", scrape_brand, hour=3)

        scheduler.start()
    """

    def __init__(self):
        self.scheduler = BackgroundScheduler()
        self.jobs: Dict[str, str] = {}  # brand_slug -> job_id
        self._started = False

    def add_interval_job(
        self,
        brand_slug: str,
        func: Callable,
        hours: int = 6,
        minutes: int = 0,
        start_immediately: bool = False,
    ) -> str:
        """
        Add a job that runs at fixed intervals.

        Args:
            brand_slug: Brand identifier
            func: Function to call (receives brand_slug as argument)
            hours: Hours between runs
            minutes: Additional minutes between runs
            start_immediately: Run once immediately on add

        Returns:
            Job ID
        """
        trigger = IntervalTrigger(hours=hours, minutes=minutes)

        job = self.scheduler.add_job(
            func,
            trigger=trigger,
            args=[brand_slug],
            id=f"interval_{brand_slug}",
            name=f"Scrape {brand_slug} (interval)",
            replace_existing=True,
        )

        self.jobs[brand_slug] = job.id
        logger.info(f"Scheduled {brand_slug} to run every {hours}h {minutes}m")

        if start_immediately and self._started:
            self.scheduler.add_job(
                func,
                args=[brand_slug],
                id=f"immediate_{brand_slug}",
                name=f"Immediate scrape {brand_slug}",
            )

        return job.id

    def add_cron_job(
        self,
        brand_slug: str,
        func: Callable,
        hour: int = 3,
        minute: int = 0,
        day_of_week: str = "*",
    ) -> str:
        """
        Add a job that runs on a cron schedule.

        Args:
            brand_slug: Brand identifier
            func: Function to call (receives brand_slug as argument)
            hour: Hour to run (0-23)
            minute: Minute to run (0-59)
            day_of_week: Days to run (* for all, 0-6 or mon-sun)

        Returns:
            Job ID
        """
        trigger = CronTrigger(hour=hour, minute=minute, day_of_week=day_of_week)

        job = self.scheduler.add_job(
            func,
            trigger=trigger,
            args=[brand_slug],
            id=f"cron_{brand_slug}",
            name=f"Scrape {brand_slug} (cron)",
            replace_existing=True,
        )

        self.jobs[brand_slug] = job.id
        logger.info(
            f"Scheduled {brand_slug} to run at {hour:02d}:{minute:02d} "
            f"(days: {day_of_week})"
        )

        return job.id

    def remove_job(self, brand_slug: str) -> bool:
        """
        Remove a scheduled job for a brand.

        Args:
            brand_slug: Brand identifier

        Returns:
            True if job was removed, False if not found
        """
        if brand_slug in self.jobs:
            job_id = self.jobs[brand_slug]
            self.scheduler.remove_job(job_id)
            del self.jobs[brand_slug]
            logger.info(f"Removed scheduled job for {brand_slug}")
            return True
        return False

    def get_next_run(self, brand_slug: str) -> Optional[datetime]:
        """
        Get the next scheduled run time for a brand.

        Args:
            brand_slug: Brand identifier

        Returns:
            Next run datetime or None if not scheduled
        """
        if brand_slug in self.jobs:
            job = self.scheduler.get_job(self.jobs[brand_slug])
            if job:
                return job.next_run_time
        return None

    def list_jobs(self) -> List[Dict]:
        """
        List all scheduled jobs.

        Returns:
            List of job info dictionaries
        """
        jobs = []
        for brand_slug, job_id in self.jobs.items():
            job = self.scheduler.get_job(job_id)
            if job:
                jobs.append(
                    {
                        "brand": brand_slug,
                        "job_id": job_id,
                        "name": job.name,
                        "next_run": job.next_run_time.isoformat()
                        if job.next_run_time
                        else None,
                    }
                )
        return jobs

    def start(self):
        """Start the scheduler."""
        if not self._started:
            self.scheduler.start()
            self._started = True
            logger.info("Scheduler started")

    def stop(self):
        """Stop the scheduler."""
        if self._started:
            self.scheduler.shutdown(wait=True)
            self._started = False
            logger.info("Scheduler stopped")

    def run_now(self, brand_slug: str, func: Callable):
        """
        Run a scrape job immediately (outside of schedule).

        Args:
            brand_slug: Brand identifier
            func: Function to call
        """
        self.scheduler.add_job(
            func,
            args=[brand_slug],
            id=f"manual_{brand_slug}_{datetime.now().timestamp()}",
            name=f"Manual scrape {brand_slug}",
        )
        logger.info(f"Triggered immediate scrape for {brand_slug}")
