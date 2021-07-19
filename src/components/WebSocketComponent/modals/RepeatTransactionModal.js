
/* eslint-disable react/no-direct-mutation-state */
/* eslint-disable import/no-anonymous-default-export */
import { Button, Modal, Form, Table } from 'react-bootstrap';
import { faSave } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import CrudStatusEnum from '../../../enums/CrudStatusEnum';
import { NumberFormat } from '../../../formatters/NumberFormat';
import { DateFormat } from '../../../formatters/DateFormat';
import NumberFormatOriginal from 'react-number-format';
import React from 'react';
import MessageReceiverEnum from '../../../enums/MessageReceiverEnum';

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
            count: 1,
            show: false,
            table_body: ``,
            transactions: []
        };
        instance = this
    }

    hide() {
        this.state.show = false
        this.forceUpdate()
    }

    open(transaction) {
        this.state.transaction = transaction
        this.state.show = true
        this.state.count = 1
        this.update()
    }

    save() {
        for (const transaction of this.state.transactions) {
            const clone = Object.assign({}, transaction);
            clone.date = `${clone.date.getFullYear()}-${((clone.date.getMonth() + 1) + '').padStart(2, '0')}-${(clone.date.getDate() + '').padStart(2, '0')}`
            this.sendJsonMessage({
                code: MessageReceiverEnum.TRANSACTION,
                status: CrudStatusEnum.ADD_EDIT,
                accountId: clone.account_id,
                values: clone
            });
        }
        this.hide()
    }

    update(count) {
        const trList = [];
        this.state.count = count;
        this.state.transactions = [];
        for (let i = 1; i <= count; i++) {
            const clone = Object.assign({}, this.state.transaction);
            const date = new Date(this.state.transaction.date)
            clone.date = new Date(date.setMonth(date.getMonth() + i))
            clone.paid = false
            this.state.transactions.push(clone)
            trList.push(
                <tr>

                    <td>
                        <DateFormat value={clone.date} t={t} />
                    </td>
                    <td>
                        {clone.description}
                    </td>
                    <td>
                        <NumberFormat value={clone.value} t={t} />
                    </td>
                </tr>
            )
        }
        this.state.table_body = [
            <tbody>
                {trList}
            </tbody>
        ]
        this.forceUpdate()
    }

    render() {
        const transaction = this.state.transaction
        return (
            <Modal show={this.state.show} onHide={() => this.hide()} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        {t('common.repeat')} {t('accounts.title')}
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
                            <Form.Control type="text" value={transaction.description} onChange={(event) => this.update('description', event.target.value)} disabled />
                        </Form.Group>
                        <Form.Group>
                            <NumberFormatOriginal className="form-control" value={this.state.count} onChange={(event) => { this.update(event.target.value) }} />
                        </Form.Group>
                        <Table>
                            <thead>
                                <tr>
                                    <th>
                                        {t(`common.date`)}
                                    </th>
                                    <th>
                                        {t(`common.description`)}
                                    </th>
                                    <th>
                                        {t(`common.value`)}
                                    </th>
                                </tr>
                            </thead>
                            {this.state.table_body}
                        </Table>
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
    open: (transaction) => {
        instance.open(transaction)
    }
}