import Component from '@ember/component';
import ComputedProperty, { alias, equal, bool, mapBy } from '@ember/object/computed';
import { get, set, getWithDefault, getProperties, computed } from '@ember/object';
import { action } from 'ember-decorators/object';
import {
  IComplianceChangeSet,
  IdentifierFieldWithFieldChangeSetTuple,
  ISuggestedFieldTypeValues
} from 'wherehows-web/typings/app/dataset-compliance';
import {
  changeSetReviewableAttributeTriggers,
  ComplianceFieldIdValue,
  complianceFieldChangeSetItemFactory,
  SuggestionIntent,
  fieldTagsRequiringReview,
  tagsHaveNoneAndNotNoneType,
  tagsHaveNoneType,
  suggestedIdentifierTypesInList
} from 'wherehows-web/constants';
import { getTagSuggestions } from 'wherehows-web/utils/datasets/compliance-suggestions';
import { IColumnFieldProps } from 'wherehows-web/typings/app/dataset-columns';
import { fieldTagsHaveIdentifierType } from 'wherehows-web/constants/dataset-compliance';
import { IComplianceDataType } from 'wherehows-web/typings/api/list/compliance-datatypes';
import { arrayReduce } from 'wherehows-web/utils/array';
import { IComplianceEntity } from 'wherehows-web/typings/api/datasets/compliance';

export default class DatasetComplianceRollupRow extends Component.extend({
  tagName: ''
}) {
  /**
   * References the parent external action to handle double click events on the field name
   * @memberof DatasetComplianceRollupRow
   */
  onFieldDblClick: () => void;
  /**
   * References the parent external action to add a tag to the list of change sets
   * @memberof DatasetComplianceRollupRow
   */
  onFieldTagAdded: (tag: IComplianceChangeSet) => IComplianceChangeSet;

  /**
   * References the parent external action to add a tag to the list of change sets
   * @memberof DatasetComplianceRollupRow
   */
  onFieldTagRemoved: (tag: IComplianceChangeSet) => IComplianceChangeSet;

  /**
   * Describes action interface for `onSuggestionIntent` action
   * @memberof DatasetComplianceRollupRow
   */
  onSuggestionIntent: (tag: IComplianceChangeSet, intent?: SuggestionIntent) => void;

  /**
   * Describes action interface for `onTagIdentifierTypeChange` action
   * @memberof DatasetComplianceRollupRow
   */
  onTagIdentifierTypeChange: (tag: IComplianceChangeSet, option: { value: ComplianceFieldIdValue | null }) => void;

  /**
   * Reference to the compliance data types
   * @type {Array<IComplianceDataType>}
   */
  complianceDataTypes: Array<IComplianceDataType>;

  /**
   * Flag indicating if the row is expanded or collapsed
   * @type {boolean}
   * @memberof DatasetComplianceRollupRow
   */
  isRowExpanded: boolean | void;

  /**
   * Flag indicating the field has a readonly attribute
   * @type ComputedProperty<boolean>
   * @memberof DatasetComplianceRollupRow
   */
  isReadonlyField: ComputedProperty<boolean> = bool('fieldProps.readonly');

  /**
   * Checks that the field requires user attention
   * @type {ComputedProperty<boolean>}
   * @memberof DatasetComplianceRollupRow
   */
  isReviewRequested = computed(
    `fieldChangeSet.@each.{${changeSetReviewableAttributeTriggers}}`,
    'complianceDataTypes',
    function(this: DatasetComplianceRollupRow): boolean {
      const tags = get(this, 'fieldChangeSet');
      const { length } = fieldTagsRequiringReview(get(this, 'complianceDataTypes'))(get(this, 'identifierField'))(tags);

      return !!length || tagsHaveNoneAndNotNoneType(tags);
    }
  );

  /**
   * References the compliance field tuple containing the field name and the field change set properties
   * @type {IdentifierFieldWithFieldChangeSetTuple}
   * @memberof DatasetComplianceRollupRow
   */
  field: IdentifierFieldWithFieldChangeSetTuple;

  constructor() {
    super(...arguments);

    const { isRowDirty, isReviewRequested } = getProperties<
      { isRowDirty: boolean; isReviewRequested: boolean },
      'isRowDirty' | 'isReviewRequested'
    >(this, ['isRowDirty', 'isReviewRequested']);

    // if any tag is dirty or requires review, then expand the parent row on instantiation
    this.isRowExpanded || (this.isRowExpanded = isRowDirty || isReviewRequested);
  }

  /**
   * References the first item in the IdentifierFieldWithFieldChangeSetTuple tuple, which is the field name
   * @type {ComputedProperty<string>}
   * @memberof DatasetComplianceRollupRow
   */
  identifierField: ComputedProperty<string> = alias('field.firstObject');

  /**
   * References the second item in the IdentifierFieldWithFieldChangeSetTuple type, this is the list of tags
   * for this field
   * @type {ComputedProperty<Array<IComplianceChangeSet>>}
   * @memberof DatasetComplianceRollupRow
   */
  fieldChangeSet: ComputedProperty<Array<IComplianceChangeSet>> = alias('field.1');

  /**
   * References the first tag in the change set, this is the primary tag for the field and should not be deleted
   * from the changeSet, contains the default properties for the field
   * @type {ComputedProperty<IComplianceChangeSet>}
   * @memberof DatasetComplianceRollupRow
   */
  fieldProps: ComputedProperty<IComplianceChangeSet> = alias('fieldChangeSet.firstObject');

  /**
   * Aliases the dataType property on the first item in the field change set, this should available
   * regardless of if the field already exists on the compliance policy or otherwise
   * @type {ComputedProperty<string>}
   * @memberof DatasetComplianceRollupRow
   */
  dataType: ComputedProperty<string> = alias('fieldProps.dataType');

  /**
   * Checks if the field has only one tag
   * @type {ComputedProperty<boolean>}
   * @memberof DatasetComplianceRollupRow
   */
  hasSingleTag: ComputedProperty<boolean> = equal('fieldChangeSet.length', 1);

  /**
   * Checks if any of the tags on this field have a ComplianceFieldIdValue.None identifierType
   * @type {ComputedProperty<boolean>}
   */
  hasNoneTag: ComputedProperty<boolean> = computed('fieldChangeSet', function(
    this: DatasetComplianceRollupRow
  ): boolean {
    return tagsHaveNoneType(get(this, 'fieldChangeSet'));
  });

  /**
   * Checks if any of the field tags for this row are dirty
   * @type {ComputedProperty<boolean>}
   * @memberof DatasetComplianceRollupRow
   */
  isRowDirty: ComputedProperty<boolean> = computed('fieldChangeSet', function(
    this: DatasetComplianceRollupRow
  ): boolean {
    return get(this, 'fieldChangeSet').some(tag => tag.isDirty);
  });

  /**
   * Reference to the current value of the field's SuggestionIntent if present
   * indicates that the provided suggestion is either accepted or ignored
   * @type {(ComputedProperty<SuggestionIntent | void>)}
   * @memberof DatasetComplianceRollupRow
   */
  suggestionAuthority: ComputedProperty<IComplianceChangeSet['suggestionAuthority']> = alias(
    'fieldProps.suggestionAuthority'
  );

  /**
   * Extracts the field suggestions into a cached computed property, if a suggestion exists
   * @type {(ComputedProperty<{ identifierType: ComplianceFieldIdValue; logicalType: string; confidence: number } | void>)}
   * @memberof DatasetComplianceRollupRow
   */
  suggestion = computed('fieldProps.suggestion', 'suggestionAuthority', function(
    this: DatasetComplianceRollupRow
  ): ISuggestedFieldTypeValues | void {
    return getTagSuggestions(getWithDefault(this, 'fieldProps', <IComplianceChangeSet>{}));
  });

  /**
   * Maps the suggestion response, if present, to a string resolution
   * @type ComputedProperty<string | void>
   * @memberof DatasetComplianceRollupRow
   */
  suggestionResolution = computed('suggestionAuthority', function(this: DatasetComplianceRollupRow): string | void {
    const suggestionAuthority = get(this, 'suggestionAuthority');

    if (suggestionAuthority) {
      return {
        [SuggestionIntent.accept]: 'Accepted',
        [SuggestionIntent.ignore]: 'Discarded'
      }[suggestionAuthority];
    }
  });

  /**
   * Lists the ComplianceFieldIdValue values this field is currently tagged with
   * @type {ComputedProperty<Array<ComplianceFieldIdValue>>}
   * @memberof DatasetComplianceRollupRow
   */
  taggedIdentifiers: ComputedProperty<Array<IComplianceEntity['identifierType']>> = mapBy(
    'fieldChangeSet',
    'identifierType'
  );

  /**
   * Lists the identifierTypes that are suggested values but are currently in the fields tags
   * @type {ComputedProperty<Array<string>>}
   * @memberof DatasetComplianceRollupRow
   * TODO: multi valued suggestions
   */
  suggestedValuesInChangeSet = computed('taggedIdentifiers', 'suggestion', function(
    this: DatasetComplianceRollupRow
  ): Array<IComplianceEntity['identifierType']> {
    const { taggedIdentifiers, suggestion } = getProperties(this, ['taggedIdentifiers', 'suggestion']);

    return arrayReduce(suggestedIdentifierTypesInList(suggestion), [])(taggedIdentifiers);
  });

  /**
   * Checks the a suggested value for this field matches a value currently set in a field tag
   * @type ComputedProperty<boolean>
   * @memberof DatasetComplianceRollupRow
   */
  suggestionMatchesCurrentValue = computed('suggestedValuesInChangeSet', function(
    this: DatasetComplianceRollupRow
  ): boolean {
    const { suggestedValuesInChangeSet, suggestion } = getProperties(this, [
      'suggestedValuesInChangeSet',
      'suggestion'
    ]);

    if (suggestion) {
      const { identifierType } = suggestion;
      return !!identifierType && suggestedValuesInChangeSet.includes(identifierType);
    }

    return false;
  });

  /**
   * Mouse double click event handler invokes parent action
   * @memberof DatasetComplianceRollupRow
   */
  @action
  onFragmentDblClick() {
    get(this, 'onFieldDblClick')();
  }

  /**
   * Toggles the expansion / collapse of the row expansion flag
   * @memberof DatasetComplianceRollupRow
   */
  @action
  onToggleRowExpansion() {
    this.toggleProperty('isRowExpanded');
  }

  /**
   * Invokes the external action to edit the compliance policy and expands the clicked row
   * for editing
   * @param {() => void} externalEditAction
   */
  @action
  onEditPolicy(this: DatasetComplianceRollupRow, externalEditAction: () => void) {
    externalEditAction();
    set(this, 'isRowExpanded', true);
  }

  /**
   * Handles adding a field tag when the user indicates the action through the UI
   * @memberof DatasetComplianceRollupRow
   */
  @action
  onAddFieldTag(this: DatasetComplianceRollupRow, { identifierType, logicalType }: Partial<IColumnFieldProps>) {
    const { identifierField, dataType, onFieldTagAdded, fieldChangeSet, fieldProps } = getProperties(this, [
      'identifierField',
      'dataType',
      'onFieldTagAdded',
      'fieldChangeSet',
      'fieldProps'
    ]);

    if (fieldTagsHaveIdentifierType(fieldChangeSet)) {
      onFieldTagAdded(
        complianceFieldChangeSetItemFactory({
          identifierField,
          dataType,
          identifierType,
          logicalType,
          suggestion: fieldProps.suggestion,
          suggestionAuthority: fieldProps.suggestionAuthority
        })
      );
    }

    // expand row on click
    set(this, 'isRowExpanded', true);
  }

  /**
   * Handles the removal of a field tag from the list of change set items
   * @param {IComplianceChangeSet} tag
   * @memberof DatasetComplianceRollupRow
   */
  @action
  onRemoveFieldTag(this: DatasetComplianceRollupRow, tag: IComplianceChangeSet) {
    const onFieldTagRemoved = get(this, 'onFieldTagRemoved');

    if (typeof onFieldTagRemoved === 'function' && !get(this, 'hasSingleTag')) {
      onFieldTagRemoved(tag);
    }
  }

  /**
   * Handler for user interactions with a suggested value. Applies / ignores the suggestion
   * Then invokes the parent supplied suggestion handler
   * @param {SuggestionIntent} intent a binary indicator to accept or ignore suggestion
   * @memberof DatasetComplianceRollupRow
   */
  @action
  onSuggestionClick(this: DatasetComplianceRollupRow, intent: SuggestionIntent = SuggestionIntent.ignore) {
    const { onSuggestionIntent, suggestedValuesInChangeSet, suggestion, hasSingleTag } = getProperties(this, [
      'onSuggestionIntent',
      'suggestedValuesInChangeSet',
      'suggestion',
      'hasSingleTag'
    ]);

    // Accept the suggestion for either identifierType and/or logicalType
    if (suggestion && intent === SuggestionIntent.accept) {
      const { identifierType, logicalType } = suggestion;
      const updateDefault = hasSingleTag && !fieldTagsHaveIdentifierType(get(this, 'fieldChangeSet'));

      if (identifierType && !suggestedValuesInChangeSet.includes(identifierType)) {
        if (updateDefault) {
          get(this, 'onTagIdentifierTypeChange')(get(this, 'fieldProps'), {
            value: <ComplianceFieldIdValue>identifierType
          });
        } else {
          this.actions.onAddFieldTag.call(this, { identifierType, logicalType });
        }
      }
    }

    // Invokes parent handle to ignore future revisits of this suggestion
    if (typeof onSuggestionIntent === 'function') {
      onSuggestionIntent(get(this, 'fieldProps'), intent);
    }
  }
}
