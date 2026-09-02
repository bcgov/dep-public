"""Service for report setting management."""

from api.constants.report_setting_type import FormIoComponentType as ComponentType
from api.models.report_setting import ReportSetting as ReportSettingModel
from api.models.survey import Survey as SurveyModel
from api.schemas.report_setting import ReportSettingSchema


REPORT_COMPONENT_TYPES = [
    ComponentType.RADIO, ComponentType.RADIO_ADVANCED,
    ComponentType.CHECKBOX, ComponentType.CHECKBOX_ADVANCED,
    ComponentType.SELECTLIST, ComponentType.SELECTLIST_ADVANCED,
    ComponentType.TEXTAREA, ComponentType.TEXTAREA_ADVANCED,
    ComponentType.TEXTFIELD, ComponentType.TEXTFIELD_ADVANCED,
    ComponentType.SURVEY,
]


class ReportSettingService:
    """Report setting management service."""

    @staticmethod
    def get_report_setting(survey_id):
        """Get report setting by survey id."""
        report_setting = ReportSettingModel.find_by_survey_id(survey_id)
        settings = ReportSettingSchema(many=True).dump(report_setting)
        return settings

    @classmethod
    def refresh_report_setting(cls, survey_id, form_components):
        """Refresh report setting."""
        if form_components == []:
            raise ValueError('No question available on survey to access settings')

        survey_question_keys = []

        for component in form_components:
            if component['type'] == ComponentType.SURVEY:
                questions = component['questions']
                if not questions:
                    continue
                for question in questions:
                    cls._create_or_update_data_for_survey_type(survey_id, component, question,
                                                               survey_question_keys)
            else:
                cls._create_or_update_data(survey_id, component, survey_question_keys)

        cls._delete_questions_removed_from_form(survey_id, survey_question_keys)

        return form_components

    @staticmethod
    def _create_or_update_data(survey_id, component, survey_question_keys) -> ReportSettingModel:
        report_setting = ReportSettingModel.find_by_question_key(survey_id, component['key'])
        survey_question_keys.append(component['key'])

        # Update the record if its existing
        if report_setting:
            report_setting.question_id = component['id']
            report_setting.question = component['label']
        else:
            # Create the record if its not existing
            report_setting = ReportSettingModel(survey_id=survey_id,
                                                question_id=component['id'],
                                                question_key=component['key'],
                                                question_type=component['type'],
                                                question=component['label'],
                                                display=True
                                                )

        report_setting.save()

    @staticmethod
    def _create_or_update_data_for_survey_type(survey_id, component, question,
                                               survey_question_keys) -> ReportSettingModel:
        # For component type SURVEY the unique identifier is a combination of key and value. The key for each
        # question will be same as its part of a single component within form json
        report_setting = ReportSettingModel.find_by_question_key(survey_id,
                                                                 component['key'] + '-' + question['value'])
        survey_question_keys.append(component['key'] + '-' + question['value'])

        # Update the record if its existing
        if report_setting:
            report_setting.question_id = component['id'] + '-' + question['value']
            report_setting.question_key = component['key'] + '-' + question['value']
            report_setting.question = component['label']
        else:
            # Create the record if its not existing
            report_setting = ReportSettingModel(survey_id=survey_id,
                                                question_id=component['id'] + '-' + question['value'],
                                                question_key=component['key'] + '-' + question['value'],
                                                question_type=component['type'],
                                                question=question['label'],
                                                display=True
                                                )

        report_setting.save()

    @classmethod
    def _delete_questions_removed_from_form(cls, survey_id, survey_question_keys):
        # Loop through the data from report setting and delete any record which does not exist on
        # survey form. This will happen if a existing survey question is deleted from the survey
        report_settings = cls.get_report_setting(survey_id)

        report_setting_keys_to_delete = [report_setting['question_key'] for report_setting in report_settings
                                         if report_setting['question_key'] not in survey_question_keys]
        if len(report_setting_keys_to_delete) > 0:
            ReportSettingModel.delete_report_settings(survey_id, report_setting_keys_to_delete)

        return report_setting_keys_to_delete

    @classmethod
    def update_report_setting(cls, survey_id, new_report_settings):
        """Update report setting."""
        survey = SurveyModel.find_by_id(survey_id)
        if not survey:
            raise KeyError(f'No survey found for {survey_id}')

        report_settings_update_mapping = [{
            'id': setting.get('id', None),
            'display': setting.get('display', None)
        } for setting in new_report_settings]

        updated_report_settings = ReportSettingModel.update_report_settings_bulk(report_settings_update_mapping)
        return updated_report_settings
