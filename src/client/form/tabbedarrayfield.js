import React from "react";
import {
  Tabs,
  Tab,
  Row,
  Col,
  Nav,
  MenuItem,
  NavDropdown,
  NavItem
} from "react-bootstrap";

import {
  getDefaultFormState,
  getUiOptions,
  isFixedItems,
  allowAdditionalItems,
  retrieveSchema,
  toIdSchema,
  getDefaultRegistry
} from "react-jsonschema-form/lib/utils";
import PropTypes from "prop-types";

function ArrayFieldTitle({ TitleField, idSchema, title, required }) {
  if (!title) {
    // See #312: Ensure compatibility with old versions of React.
    return <div />;
  }
  const id = `${idSchema.$id}__title`;
  return <TitleField id={id} title={title} required={required} />;
}

function ArrayFieldDescription({ DescriptionField, idSchema, description }) {
  if (!description) {
    // See #312: Ensure compatibility with old versions of React.
    return <div />;
  }
  const id = `${idSchema.$id}__description`;
  return <DescriptionField id={id} description={description} />;
}

function IconBtn(props) {
  const { type = "default", icon, className, ...otherProps } = props;
  return (
    <button
      type="button"
      className={`btn btn-${type} ${className}`}
      {...otherProps}
    >
      <i className={`glyphicon glyphicon-${icon}`} />
    </button>
  );
}

class TabbedArrayItemHeader extends React.Component {
  constructor(props) {
    super(props);

    this.state = { isOpen: false };

    this.btnStyle = {
      flex: 1,
      paddingLeft: 6,
      paddingRight: 6,
      fontWeight: "bold"
    };
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.isOpen && prevState.isOpen) {
      this.setState({ isOpen: false });
    }
  }

  render() {
    let props = this.props;
    return (
      <NavItem
        eventKey={props.index}
        onClick={() => props.onSelect(props.index)}
      >
        <div
          style={{ display: "flex" }}
          className={"dropdown" + (this.state.isOpen ? " open" : "")}
        >
          {props.tabName}
          {props.hasRemove && (
            <div onClick={() => this.setState({ isOpen: !this.state.isOpen })}>
              <span className="caret" style={{ margin: "7px" }} />
            </div>
          )}
          <div className="dropdown-menu" style={{ marginLeft: -15 }}>
            <div
              tabIndex="-1"
              style={this.btnStyle}
              disabled={props.disabled || props.readonly}
              onClick={props.onDropIndexClick(props.index)}
            >
              Remove
            </div>
          </div>
        </div>
      </NavItem>
    );
  }
}

function TabbedArrayItemContent(props) {
  const btnStyle = {
    flex: 1,
    paddingLeft: 6,
    paddingRight: 6,
    fontWeight: "bold"
  };

  return (
    <Tab.Pane eventKey={props.index}>
      <div className={props.className}>
        <div className="col-xs-12">
          {props.children}
        </div>

        {props.hasToolbar && (
          <div className="col-xs-3 array-item-toolbox">
            <div
              className="btn-group"
              style={{
                display: "flex",
                justifyContent: "space-around"
              }}
            />
          </div>
        )}
      </div>
    </Tab.Pane>
  );
}

function TabbedArrayFieldTemplate(props) {
  return (
    <fieldset className={props.className}>
      <ArrayFieldTitle
        TitleField={props.TitleField}
        idSchema={props.idSchema}
        title={props.uiSchema["ui:title"] || props.title}
        required={props.required}
      />

      {(props.uiSchema["ui:description"] || props.schema.description) && (
        <ArrayFieldDescription
          DescriptionField={props.DescriptionField}
          idSchema={props.idSchema}
          description={
            props.uiSchema["ui:description"] || props.schema.description
          }
        />
      )}

      <Tab.Container
        defaultActiveKey={0}
        activeKey={props.activeKey}
        id={`array-item-list-${props.idSchema.$id}`}
        onSelect={eventKey => {
          if (eventKey == "+") {
            props.onAddClick(document.createEvent("Event"));
          } else {
            props.onSelect(eventKey);
          }
        }}
      >
        <Row className="clearfix">
          <Col sm={12}>
            <Nav bsStyle="tabs">
              {props.items &&
                props.items.map((p, index) => (
                  <TabbedArrayItemHeader
                    key={index}
                    {...p}
                  />
                ))}
              {props.canAdd && (
                <NavItem
                  eventKey="+"
                  disabled={props.disabled || props.readonly}
                >
                  +
                </NavItem>
              )}
            </Nav>
          </Col>
          <Col sm={12}>
            <Tab.Content animation>
              {props.items &&
                props.items.map((p, index) => (
                  <TabbedArrayItemContent
                    key={index}
                    {...p}
                  />
                ))}
              <Tab.Pane eventKey="+">Adding...</Tab.Pane>
            </Tab.Content>
          </Col>
        </Row>
      </Tab.Container>
    </fieldset>
  );
}

export class TabbedArrayField extends React.Component {
  static defaultProps = {
    uiSchema: {},
    formData: [],
    idSchema: {},
    required: false,
    disabled: false,
    readonly: false,
    autofocus: false
  };

  get itemTitle() {
    const { schema } = this.props;
    return schema.items.title || schema.items.description || "Item";
  }

  isItemRequired(itemSchema) {
    if (Array.isArray(itemSchema.type)) {
      // While we don't yet support composite/nullable jsonschema types, it's
      // future-proof to check for requirement against these.
      return !itemSchema.type.includes("null");
    }
    // All non-null array item types are inherently required by design
    return itemSchema.type !== "null";
  }

  canAddItem(formItems) {
    const { schema, uiSchema } = this.props;
    let { addable } = getUiOptions(uiSchema);
    if (addable !== false) {
      // if ui:options.addable was not explicitly set to false, we can add
      // another item if we have not exceeded maxItems yet
      if (schema.maxItems !== undefined) {
        addable = formItems.length < schema.maxItems;
      } else {
        addable = true;
      }
    }
    return addable;
  }

  onAddClick = event => {
    event.preventDefault();
    const { schema, formData, registry = getDefaultRegistry() } = this.props;
    const { definitions } = registry;
    let itemSchema = schema.items;
    if (isFixedItems(schema) && allowAdditionalItems(schema)) {
      itemSchema = schema.additionalItems;
    }
    this.props.onChange([
      ...formData,
      getDefaultFormState(itemSchema, undefined, definitions)
    ]);

    this.onSelect(formData.length);
  };

  onDropIndexClick = index => {
    return event => {
      if (event) {
        event.preventDefault();
      }
      const { formData, onChange } = this.props;
      // refs #195: revalidate to ensure properly reindexing errors
      let newErrorSchema;
      if (this.props.errorSchema) {
        newErrorSchema = {};
        const errorSchema = this.props.errorSchema;
        for (let i in errorSchema) {
          i = parseInt(i);
          if (i < index) {
            newErrorSchema[i] = errorSchema[i];
          } else if (i > index) {
            newErrorSchema[i - 1] = errorSchema[i];
          }
        }
      }
      onChange(formData.filter((_, i) => i !== index), newErrorSchema);
    };
  };

  onReorderClick = (index, newIndex) => {
    return event => {
      if (event) {
        event.preventDefault();
        event.target.blur();
      }
      const { formData, onChange } = this.props;
      let newErrorSchema;
      if (this.props.errorSchema) {
        newErrorSchema = {};
        const errorSchema = this.props.errorSchema;
        for (let i in errorSchema) {
          if (i == index) {
            newErrorSchema[newIndex] = errorSchema[index];
          } else if (i == newIndex) {
            newErrorSchema[index] = errorSchema[newIndex];
          } else {
            newErrorSchema[i] = errorSchema[i];
          }
        }
      }
      onChange(
        formData.map((item, i) => {
          // i is string, index and newIndex are numbers,
          // so using "==" to compare
          if (i == newIndex) {
            return formData[index];
          } else if (i == index) {
            return formData[newIndex];
          } else {
            return item;
          }
        }),
        newErrorSchema
      );
    };
  };

  onChangeForIndex = index => {
    return (value, errorSchema) => {
      const { formData, onChange } = this.props;
      const newFormData = formData.map((item, i) => {
        // We need to treat undefined items as nulls to have validation.
        // See https://github.com/tdegrunt/jsonschema/issues/206
        const jsonValue = typeof value === "undefined" ? null : value;
        return index === i ? jsonValue : item;
      });
      onChange(
        newFormData,
        errorSchema &&
          this.props.errorSchema && {
            ...this.props.errorSchema,
            [index]: errorSchema
          }
      );
    };
  };

  onSelectChange = value => {
    this.props.onChange(value);
  };

  constructor(props) {
    super(props);

    this.state = { activeKey: 0 };
  }

  onSelect = activeKey => {
    this.setState({ activeKey });
  };

  render() {
    const {
      schema,
      uiSchema,
      formData,
      errorSchema,
      idSchema,
      name,
      required,
      disabled,
      readonly,
      autofocus,
      registry = getDefaultRegistry(),
      onBlur,
      onFocus,
      idPrefix,
      rawErrors
    } = this.props;

    const title = schema.title === undefined ? name : schema.title;
    const { ArrayFieldTemplate, definitions, fields, formContext } = registry;
    const { TitleField, DescriptionField } = fields;
    const itemsSchema = retrieveSchema(schema.items, definitions);
    const arrayProps = {
      canAdd: this.canAddItem(formData),
      items: formData.map((item, index) => {
        const itemSchema = retrieveSchema(schema.items, definitions, item);
        const itemErrorSchema = errorSchema ? errorSchema[index] : undefined;
        const itemIdPrefix = idSchema.$id + "_" + index;
        const itemIdSchema = toIdSchema(
          itemSchema,
          itemIdPrefix,
          definitions,
          item,
          idPrefix
        );
        return this.renderArrayFieldItem({
          index,
          canMoveUp: index > 0,
          canMoveDown: index < formData.length - 1,
          itemSchema: itemSchema,
          itemIdSchema,
          itemErrorSchema,
          itemData: item,
          itemUiSchema: uiSchema.items,
          autofocus: autofocus && index === 0,
          onBlur,
          onFocus
        });
      }),
      className: `field field-array field-array-of-${itemsSchema.type}`,
      DescriptionField,
      disabled,
      idSchema,
      uiSchema,
      onAddClick: this.onAddClick,
      readonly,
      required,
      schema,
      title,
      TitleField,
      formContext,
      formData,
      rawErrors,
      onSelect: this.onSelect,
      activeKey: this.state.activeKey
    };

    // Check if a custom render function was passed in
    return <TabbedArrayFieldTemplate {...arrayProps} />;
  }

  renderArrayFieldItem(props) {
    const {
      index,
      canRemove = true,
      canMoveUp = true,
      canMoveDown = true,
      itemSchema,
      itemData,
      itemUiSchema,
      itemIdSchema,
      itemErrorSchema,
      autofocus,
      onBlur,
      onFocus,
      rawErrors
    } = props;
    const {
      disabled,
      readonly,
      uiSchema,
      registry = getDefaultRegistry()
    } = this.props;
    const {
      fields: { SchemaField }
    } = registry;
    const { orderable, removable } = {
      orderable: true,
      removable: true,
      ...uiSchema["ui:options"]
    };
    const has = {
      moveUp: orderable && canMoveUp,
      moveDown: orderable && canMoveDown,
      remove: removable && canRemove
    };
    has.toolbar = Object.keys(has).some(key => has[key]);

    const tabName = itemData.name ? itemData.name : "Tab " + (index + 1);

    return {
      children: (
        <SchemaField
          schema={itemSchema}
          uiSchema={itemUiSchema}
          formData={itemData}
          errorSchema={itemErrorSchema}
          idSchema={itemIdSchema}
          required={this.isItemRequired(itemSchema)}
          onChange={this.onChangeForIndex(index)}
          onBlur={onBlur}
          onFocus={onFocus}
          registry={this.props.registry}
          disabled={this.props.disabled}
          readonly={this.props.readonly}
          autofocus={autofocus}
          rawErrors={rawErrors}
        />
      ),
      className: "array-item",
      disabled,
      hasToolbar: has.toolbar,
      hasRemove: has.remove,
      index,
      onDropIndexClick: this.onDropIndexClick,
      onReorderClick: this.onReorderClick,
      readonly,
      tabName: tabName
    };
  }
}

if (process.env.NODE_ENV !== "production") {
  TabbedArrayField.propTypes = {
    schema: PropTypes.object.isRequired,
    uiSchema: PropTypes.object,
    errorSchema: PropTypes.object,
    idSchema: PropTypes.object,
    formData: PropTypes.array.isRequired,
    required: PropTypes.bool,
    disabled: PropTypes.bool,
    readonly: PropTypes.bool
  };
}
