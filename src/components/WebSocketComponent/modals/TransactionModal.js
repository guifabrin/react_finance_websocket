
/* eslint-disable react/no-direct-mutation-state */
/* eslint-disable import/no-anonymous-default-export */
import { Button, Modal, Form } from 'react-bootstrap';
import { faSave } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import CrudStatusEnum from '../../../enums/CrudStatusEnum';
import DatePicker from "react-datepicker";
import MessageReceiverEnum from '../../../enums/MessageReceiverEnum';
import NumberFormatOriginal from 'react-number-format';
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
            transaction: {},
            options: [],
            show: false
        };
        instance = this
    }

    hide() {
        this.state.show = false
        this.forceUpdate()
    }

    open(transaction, invoices) {
        if (transaction.id) {
            transaction.date = new Date(transaction.date)
        } else {
            transaction.date = new Date()
        }
        this.state.transaction = transaction
        this.state.show = true
        if (invoices) {
            this.state.options = [<option>Selecionar fatura</option>]
            for (const invoice of invoices)
                this.state.options.push(<option key={`invoice_option_${invoice.id}`} value={invoice.id}>{invoice.id}/{invoice.description}</option>)
        } else {
            this.state.options = []
        }
        this.forceUpdate()
    }

    save() {
        const clone = Object.assign({}, this.state.transaction);
        clone.date = `${clone.date.getFullYear()}-${((clone.date.getMonth() + 1) + '').padStart(2, '0')}-${(clone.date.getDate() + '').padStart(2, '0')}`
        this.sendJsonMessage({
            code: MessageReceiverEnum.TRANSACTION,
            id: clone.id,
            status: CrudStatusEnum.ADD_EDIT,
            accountId: clone.account_id,
            values: clone
        });
        this.hide()
    }

    update(property, value) {
        const clone = Object.assign({}, this.state.transaction);
        clone[property] = value
        this.state.transaction = clone
        this.forceUpdate()
    }

    render() {
        const transaction = this.state.transaction
        return (
            <Modal show={this.state.show} onHide={() => this.hide()} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        {transaction.id ? t('common.edit') : t('common.add')} {t('accounts.title')}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group>
                            <Form.Label>{t('common.id')}</Form.Label>
                            <Form.Control type="number" value={transaction.id} disabled />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>{t('common.description')}</Form.Label>
                            <Form.Control type="text" value={transaction.description} onChange={(event) => this.update('description', event.target.value)} />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>{t('common.date')}</Form.Label>
                            <DatePicker className='form-control' type="text" selected={transaction.date ? new Date(transaction.date) : new Date()} onChange={(value) => this.update('date', value)} />
                        </Form.Group>
                        {
                            this.state.options.length > 0 &&
                            <>
                                <Form.Label>{t('transactions.invoice')}</Form.Label>
                                <Form.Group>
                                    <select value={transaction.invoice_id} onChange={(event) => { this.update('invoice_id', event.target.value) }} className="form-control">
                                        {this.state.options}
                                    </select>
                                </Form.Group>
                            </>
                        }
                        <Form.Group>
                            <Form.Check type="checkbox" label={t('transactions.paid')} checked={Boolean(transaction.paid)} onChange={(event) => this.update('paid', event.target.checked)} />
                        </Form.Group>
                        <Form.Group>
                            <NumberFormatOriginal className="form-control" value={transaction.value} onChange={(event) => { this.update('value', parseFloat(event.target.value)) }} />
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
    open: (transaction, invoices) => {
        instance.open(transaction, invoices)
    }
}