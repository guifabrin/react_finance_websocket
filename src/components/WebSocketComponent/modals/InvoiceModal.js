
/* eslint-disable react/no-direct-mutation-state */
/* eslint-disable import/no-anonymous-default-export */
import { Button, Modal, Form } from 'react-bootstrap';
import { faSave } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import CrudStatusEnum from '../../../enums/CrudStatusEnum';
import DatePicker from "react-datepicker";
import MessageReceiverEnum from '../../../enums/MessageReceiverEnum';
import React from 'react';

let t = null
let instance = null

class Elem extends React.Component {
    constructor(props) {
        super(props)
        const { sendJsonMessage } = this.props
        t = this.props.t
        this.sendJsonMessage = sendJsonMessage
        this.state = {
            account: {},
            invoice: {},
            show: false
        };
        instance = this
    }

    hide() {
        this.state.show = false
        this.forceUpdate()
    }

    open(invoice, account) {
        this.state.account = account
        if (invoice.id) {
            invoice.debit_date = new Date(invoice.debit_date)
            invoice.date_init = new Date(invoice.date_init)
            invoice.date_end = new Date(invoice.date_end)
        } else {
            invoice.debit_date = new Date()
            invoice.date_init = new Date()
            invoice.date_end = new Date()
        }
        this.state.invoice = invoice
        this.state.show = true
        this.forceUpdate()
    }

    save() {
        const clone = Object.assign({}, this.state.invoice);
        clone.date_init = `${clone.date_init.getFullYear()}-${((clone.date_init.getMonth() + 1) + '').padStart(2, '0')}-${(clone.date_init.getDate() + '').padStart(2, '0')}`
        clone.date_end = `${clone.date_end.getFullYear()}-${((clone.date_end.getMonth() + 1) + '').padStart(2, '0')}-${(clone.date_end.getDate() + '').padStart(2, '0')}`
        clone.debit_date = `${clone.debit_date.getFullYear()}-${((clone.debit_date.getMonth() + 1) + '').padStart(2, '0')}-${(clone.debit_date.getDate() + '').padStart(2, '0')}`
        this.sendJsonMessage({
            code: MessageReceiverEnum.INVOICE,
            id: clone.id,
            status: CrudStatusEnum.ADD_EDIT,
            accountId: clone.account_id,
            values: clone
        });
        this.hide()
    }

    update(property, value) {
        const clone = Object.assign({}, this.state.invoice);
        clone[property] = value
        this.state.invoice = clone
        this.forceUpdate()
    }

    render() {
        const invoice = this.state.invoice
        return (
            <Modal show={this.state.show} onHide={() => this.hide()} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        {invoice.id ? t('common.edit') : t('common.add')} {t('invoices.title')} - {this.state.account.id}/{this.state.account.description}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group>
                            <Form.Label>{t('common.id')}</Form.Label>
                            <Form.Control type="number" value={invoice.id} disabled />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>{t('common.description')}</Form.Label>
                            <Form.Control type="text" value={invoice.description} onChange={(event) => this.update('description', event.target.value)} />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>{t('invoices.debit_date')}</Form.Label>
                            <DatePicker className='form-control' type="text" selected={invoice.debit_date ? new Date(invoice.debit_date) : new Date()} onChange={(value) => this.update('debit_date', value)} />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>{t('invoices.date_init')}</Form.Label>
                            <DatePicker className='form-control' type="text" selected={invoice.date_init ? new Date(invoice.date_init) : new Date()} onChange={(value) => this.update('date_init', value)} />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>{t('invoices.date_end')}</Form.Label>
                            <DatePicker className='form-control' type="text" selected={invoice.date_end ? new Date(invoice.date_end) : new Date()} onChange={(value) => this.update('date_end', value)} />
                        </Form.Group>
                        <Button type="button" variant="primary" onClick={() => this.save()}>
                            <FontAwesomeIcon icon={faSave} />
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>
        )
    }
}
export default {
    Elem,
    open: (invoice, account) => {
        debugger
        instance.open(invoice, account)
    }
}