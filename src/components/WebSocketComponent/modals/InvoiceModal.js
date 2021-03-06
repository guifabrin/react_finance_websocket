/* eslint-disable react/no-direct-mutation-state */
/* eslint-disable import/no-anonymous-default-export */
import { Button, Modal, Form } from "react-bootstrap";
import { faSave } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import CrudStatusEnum from "../../../enums/CrudStatusEnum";
import DatePicker from "react-datepicker";
import MessageReceiverEnum from "../../../enums/MessageReceiverEnum";
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
      invoice: {},
      show: false,
    };
    instance = this;
  }

  hide() {
    this.setState({ show: false });
  }

  open(invoice, account) {
    if (invoice.id) {
      invoice.debit_date = new Date(invoice.debit_date);
    } else {
      invoice.debit_date = new Date();
    }
    this.setState({ account, invoice, show: true });
  }

  save() {
    const clone = Object.assign({}, this.state.invoice);
    clone.debit_date = `${clone.debit_date.getFullYear()}-${(
      clone.debit_date.getMonth() +
      1 +
      ""
    ).padStart(2, "0")}-${(clone.debit_date.getDate() + "").padStart(2, "0")}`;
    this.sendJsonMessage({
      code: MessageReceiverEnum.INVOICE,
      id: clone.id,
      status: CrudStatusEnum.ADD_EDIT,
      accountId: clone.account_id,
      values: clone,
    });
    this.hide();
  }

  update(property, value) {
    const clone = Object.assign({}, this.state.invoice);
    clone[property] = value;
    this.setState({ invoice: clone });
  }

  render() {
    const invoice = this.state.invoice;
    return (
      <Modal show={this.state.show} onHide={() => this.hide()} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {invoice.id ? t("common.edit") : t("common.add")}{" "}
            {t("invoices.title")} - {this.state.account.id}/
            {this.state.account.description}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>{t("common.id")}</Form.Label>
              <Form.Control type="number" value={invoice.id} disabled />
            </Form.Group>
            <Form.Group>
              <Form.Label>{t("common.description")}</Form.Label>
              <Form.Control
                type="text"
                value={invoice.description}
                onChange={(event) =>
                  this.update("description", event.target.value)
                }
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>{t("invoices.debit_date")}</Form.Label>
              <DatePicker
                className="form-control"
                type="text"
                selected={
                  invoice.debit_date ? new Date(invoice.debit_date) : new Date()
                }
                onChange={(value) => this.update("debit_date", value)}
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
  open: (invoice, account) => {
    debugger;
    instance.open(invoice, account);
  },
};
