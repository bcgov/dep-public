# Copyright © 2021 Province of British Columbia
#
# Licensed under the Apache License, Version 2.0 (the 'License');
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an 'AS IS' BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""Constants of report setting."""
from enum import Enum


class FormIoComponentType(Enum):
    """FormIO Component Types."""

    RADIO = 'simpleradios'
    CHECKBOX = 'simplecheckboxes'
    SELECTLIST = 'simpleselect'
    SURVEY = 'simplesurveyadvanced'
    TEXTAREA = 'simpletextarea'
    TEXTFIELD = 'simpletextfield'

    RADIO_ADVANCED = 'simpleradioadvanced'
    CHECKBOX_ADVANCED = 'simplecheckboxadvanced'
    SELECTLIST_ADVANCED = 'simpleselectadvanced'
    TEXTAREA_ADVANCED = 'simpletextareaadvanced'
    TEXTFIELD_ADVANCED = 'simpletextfieldadvanced'
