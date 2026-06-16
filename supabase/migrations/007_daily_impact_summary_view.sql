create or replace view public.daily_impact_summary
with (security_invoker = true)
as
with task_stats as (
  select
    user_id,
    task_date as impact_date,
    count(*)::int as total_tasks,
    count(*) filter (where is_completed)::int as completed_tasks
  from public.tasks
  group by user_id, task_date
),
journal_days as (
  select
    user_id,
    journal_date as impact_date,
    true as journal_submitted
  from public.journals
)
select
  coalesce(task_stats.user_id, journal_days.user_id) as user_id,
  coalesce(task_stats.impact_date, journal_days.impact_date) as impact_date,
  coalesce(task_stats.total_tasks, 0) as total_tasks,
  coalesce(task_stats.completed_tasks, 0) as completed_tasks,
  case
    when coalesce(task_stats.total_tasks, 0) = 0 then 0
    else round(
      (task_stats.completed_tasks::numeric / task_stats.total_tasks::numeric) * 100
    )::int
  end as completion_percentage,
  coalesce(journal_days.journal_submitted, false) as journal_submitted
from task_stats
full outer join journal_days
  on task_stats.user_id = journal_days.user_id
  and task_stats.impact_date = journal_days.impact_date;

grant select on public.daily_impact_summary to authenticated;
