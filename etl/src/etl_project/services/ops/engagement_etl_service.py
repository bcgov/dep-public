from datetime import datetime, timezone

from analytics_api.models.engagement import Engagement as EtlEngagementModel
from analytics_api.models.etlruncycle import EtlRunCycle as EtlRunCycleModel
from dagster import Out, Output, op
from sqlalchemy import func

from api.constants.engagement_status import Status as EngagementStatus
from api.models.engagement import Engagement as EngagementModel
from api.models.engagement_status import \
    EngagementStatus as EngagementStatusModel
from api.models.widget_map import WidgetMap
from api.utils.datetime import utc_now


# get the last run cycle id for engagement etl
@op(required_resource_keys={"engagement_db_session",
    "etl_db_session"},
    out={"engagement_last_run_cycle_datetime": Out(),
         "engagement_new_run_cycle_id": Out()})
def get_engagement_last_run_cycle_time(context, flag_to_run_step_after_user):
    etl_db_session = context.resources.etl_db_session
    default_datetime = datetime(1900, 1, 1, 0, 0, 0, 0)

    engagement_last_run_cycle_datetime = etl_db_session.query(
        func.coalesce(func.max(EtlRunCycleModel.enddatetime), default_datetime)).filter(
        EtlRunCycleModel.packagename == 'engagement', EtlRunCycleModel.success).first()

    max_run_cycle_id = etl_db_session.query(
        func.coalesce(func.max(EtlRunCycleModel.id), 0)).first()

    for last_run_cycle_time in engagement_last_run_cycle_datetime:

        for run_cycle_id in max_run_cycle_id:
            new_run_cycle_id = run_cycle_id + 1
            etl_db_session.add(
                EtlRunCycleModel(
                    id=new_run_cycle_id,
                    packagename='engagement',
                    startdatetime=datetime.now(timezone.utc),
                    enddatetime=None,
                    description='started the load for table engagement',
                    success=False))
            etl_db_session.commit()

    etl_db_session.close()

    yield Output(engagement_last_run_cycle_datetime, "engagement_last_run_cycle_datetime")

    yield Output(new_run_cycle_id, "engagement_new_run_cycle_id")


# extract the engagement that have been created or updated after the last run
@op(required_resource_keys={"engagement_db_session",
    "etl_db_session"},
    out={"new_engagements": Out(),
    "updated_engagements": Out(),
         "eng_new_runcycleid": Out()})
def extract_engagement(context, eng_last_run_cycle_time, eng_new_runcycleid):
    session = context.resources.engagement_db_session
    default_datetime = datetime(1900, 1, 1, 0, 0, 0, 0)
    last_run = max(eng_last_run_cycle_time) if eng_last_run_cycle_time else default_datetime

    context.log.info("started extracting new data from engagement table")
    new_engagements = session.query(EngagementModel).filter(
        EngagementModel.created_date > last_run,
        EngagementModel.status_id != EngagementStatus.Draft.value
    ).all()
    context.log.info(f"last_run={last_run}, new count={len(new_engagements)}")

    updated_engagements = []
    if last_run > default_datetime:
        updated_engagements = session.query(EngagementModel).filter(
            EngagementModel.updated_date > last_run,
            EngagementModel.status_id != EngagementStatus.Draft.value
        ).all()
    context.log.info(f"updated count={len(updated_engagements)}")

    # Compute a new cycle ID – e.g., current UTC time
    new_cycle_id = utc_now()   # import from your utils

    yield Output(new_engagements, "new_engagements")
    yield Output(updated_engagements, "updated_engagements")
    yield Output(new_cycle_id, "eng_new_runcycleid")

    session.commit()
    session.close()


# load the engagement created or updated after last run to the analytics
# database
@op(required_resource_keys={"engagement_db_session",
    "etl_db_session"},
    out={"engagement_new_runcycleid": Out()})
def load_engagement(
        context,
        new_engagements,
        updated_engagements,
        engagement_new_runcycleid):
    engagement_session = context.resources.engagement_db_session
    session = context.resources.etl_db_session
    all_engagements = new_engagements + updated_engagements
    if len(all_engagements) > 0:

        context.log.info("loading new engagement")
        for engagement in all_engagements:
            session.query(EtlEngagementModel).filter(
                EtlEngagementModel.source_engagement_id == engagement.id
            ).update({'is_active': False})

            # extract map data
            latitude = None
            longitude = None
            geojson = None
            marker_label = None
            map_widget = engagement_session.query(WidgetMap).filter(
                WidgetMap.engagement_id == engagement.id).order_by(
                WidgetMap.created_date.desc()).first()
            if map_widget:
                latitude = map_widget.latitude
                longitude = map_widget.longitude
                geojson = map_widget.geojson
                marker_label = map_widget.marker_label

            engagement_status = engagement_session.query(EngagementStatusModel).filter(
                EngagementStatusModel.id == engagement.status_id).first()

            engagement_model = EtlEngagementModel(
                name=engagement.name,
                source_engagement_id=engagement.id,
                start_date=engagement.start_date,
                end_date=engagement.end_date,
                is_active=True,
                published_date=engagement.published_date,
                runcycle_id=engagement_new_runcycleid,
                created_date=engagement.created_date,
                updated_date=engagement.updated_date,
                latitude=latitude,
                longitude=longitude,
                geojson=geojson,
                marker_label=marker_label,
                status_name=engagement_status.status_name)
            session.add(engagement_model)
            session.commit()

    yield Output(engagement_new_runcycleid, "engagement_new_runcycleid")

    context.log.info("completed loading engagement table")

    engagement_session.close()
    session.close()


# update the status for engagement etl in run cycle table as successful
@op(required_resource_keys={"engagement_db_session",
    "etl_db_session"},
    out={"flag_to_run_step_after_engagement": Out()})
def engagement_end_run_cycle(context, engagement_new_runcycleid):
    etl_db_session = context.resources.etl_db_session

    etl_db_session.query(EtlRunCycleModel).filter(
        EtlRunCycleModel.id == engagement_new_runcycleid,
        EtlRunCycleModel.packagename == 'engagement',
        EtlRunCycleModel.success.is_(False)).update(
        {
            'success': True,
            'enddatetime': datetime.now(timezone.utc),
            'description': 'ended the load for table engagement'})

    context.log.info("run cycle ended for Engagement table")

    etl_db_session.commit()

    etl_db_session.close()

    yield Output("engagement", "flag_to_run_step_after_engagement")
