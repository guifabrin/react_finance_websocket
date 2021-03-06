/* eslint-disable react/no-direct-mutation-state */
/* eslint-disable import/no-anonymous-default-export */
import { Button, Modal, Form } from "react-bootstrap";
import { faSave } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import CrudStatusEnum from "../../../enums/CrudStatusEnum";
import MessageReceiverEnum from "../../../enums/MessageReceiverEnum";
import NumberFormatOriginal from "react-number-format";
import React from "react";
import { t } from "../../../i18n";

let instance = null;

class Elem extends React.Component {
  constructor(props) {
    super(props);
    const { sendJsonMessage } = this.props;
    this.sendJsonMessage = sendJsonMessage;
    this.state = {
      account: {},
      options: [],
      show: false,
    };
    instance = this;
  }

  hide() {
    this.setState({ show: false });
  }

  open(account, accounts) {
    const options = [<option>Selecionar conta</option>];
    for (const maccount of accounts)
      if (account.id !== maccount.id && !maccount.is_credit_card)
        options.push(
          <option key={`account_option_${maccount.id}`} value={maccount.id}>
            {maccount.id}/{maccount.description}
          </option>
        );
    this.setState({ account, show: true, options });
  }

  save() {
    this.sendJsonMessage({
      code: MessageReceiverEnum.ACCOUNT,
      status: CrudStatusEnum.ADD_EDIT,
      value: this.state.account,
    });
    this.hide();
  }

  update(property, value) {
    const clone = Object.assign({}, this.state.account);
    clone[property] = value;
    this.setState({ account: clone });
  }

  render() {
    const account = this.state.account;
    return (
      <Modal show={this.state.show} onHide={() => this.hide()} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {account.id ? t("common.edit") : t("common.add")}{" "}
            {t("accounts.title")}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>{t("common.id")}</Form.Label>
              <Form.Control type="number" value={account.id} disabled />
            </Form.Group>
            <Form.Group>
              <Form.Label>{t("common.description")}</Form.Label>
              <Form.Control
                type="text"
                value={account.description}
                onChange={(event) =>
                  this.update("description", event.target.value)
                }
              />
            </Form.Group>
            <Form.Group>
              <Form.Check
                type="checkbox"
                label={t("common.ignore")}
                checked={Boolean(account.ignore)}
                onChange={(event) =>
                  this.update("ignore", event.target.checked)
                }
              />
            </Form.Group>
            <Form.Group>
              <Form.Check
                type="checkbox"
                label={t("accounts.is_credit_card")}
                checked={Boolean(account.is_credit_card)}
                onChange={(event) =>
                  this.update("is_credit_card", event.target.checked)
                }
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>{t("accounts.value_error")}</Form.Label>
              <NumberFormatOriginal
                className="form-control"
                value={account.value_error}
                onChange={(event) => {
                  this.update("value_error", parseFloat(event.target.value));
                }}
              />
            </Form.Group>
            {this.state.options.length > 0 && Boolean(account.is_credit_card) && (
              <>
                <Form.Label>{t("accounts.prefer_debit_account")}</Form.Label>
                <Form.Group>
                  <select
                    value={account.prefer_debit_account_id}
                    onChange={(event) => {
                      this.update(
                        "prefer_debit_account_id",
                        event.target.value
                      );
                    }}
                    className="form-control"
                  >
                    {this.state.options}
                  </select>
                </Form.Group>
              </>
            )}
            <Form.Group>
              <Form.Label>{t("accounts.automated_args")}</Form.Label>
              <Form.Control
                type="text"
                value={account.automated_args}
                onChange={(event) =>
                  this.update("automated_args", event.target.value)
                }
              />
            </Form.Group>
            <Form.Group>
              <Form.Check
                type="checkbox"
                label={t("accounts.automated_body")}
                checked={Boolean(account.automated_body)}
                onChange={(event) =>
                  this.update("automated_body", event.target.checked)
                }
              />
            </Form.Group>
            <Button type="button" variant="primary" onClick={() => this.save()}>
              <FontAwesomeIcon icon={faSave} />
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    );
  }
}
export default {
  Elem,
  open: (account, accounts) => {
    instance.open(account, accounts);
  },
};
