/* eslint-disable react/no-direct-mutation-state */
/* eslint-disable import/no-anonymous-default-export */
import { Button, Modal, Table, Form } from 'react-bootstrap';
import { faPlus, faPen, faTrash, faSync } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import CrudStatusEnum from '../../../enums/CrudStatusEnum';
import MessageReceiverEnum from '../../../enums/MessageReceiverEnum';
import React from 'react';
import { NumberFormat } from '../../../formatters/NumberFormat';
import TransactionTypeEnum from '../../../enums/TransactionTypeEnum';
import { DateFormat } from '../../../formatters/DateFormat';
import ReactLoading from 'react-loading';
import TransactionModal from './TransactionModal';
import RepeatTransactionModal from './RepeatTransactionModal';

let t = null
let instance = null

class Elem extends React.Component {
    constructor(props) {
        super(props)
        const { sendJsonMessage } = this.props
        t = this.props.t
        this.sendJsonMessage = sendJsonMessage
        this.state = {
            title: '',
            table_header: null,
            table_body: null,
            table_footer: null,
            show: false
        };
        this.type = 0;
        this.last = {}
        instance = this
    }

    hide() {
        this.state.show = false
        this.forceUpdate()
    }

    pay(transaction, paid) {
        transaction.paid = paid
        this.sendJsonMessage({
            code: MessageReceiverEnum.TRANSACTION,
            status: CrudStatusEnum.ADD_EDIT,
            id: transaction.id,
            accountId: transaction.account_id,
            values: {
                paid
            }
        });
    }

    delete(transaction) {
        this.sendJsonMessage({
            code: MessageReceiverEnum.TRANSACTION,
            id: transaction.id,
            status: CrudStatusEnum.REMOVE,
            accountId: transaction.account_id,
        });
    }

    reload() {
        if (this.state.show) {
            this.open(this.last.account, this.last.invoice, this.last.year, this.last.month)
        }
    }

    update(transactions) {
        const trList = []
        for (const transaction of transactions) {
            const tdList = [
                <td><DateFormat value={transaction.date} t={t} /></td>,
                <td>{transaction.description}</td>,
                <td><NumberFormat t={t} value={transaction.value} /></td>
            ]
            if (this.type === 0) {
                tdList.push(
                    <td>
                        <Form.Group>
                            <Form.Check type="checkbox" checked={Boolean(transaction.paid)} onChange={() => this.pay(transaction, !Boolean(transaction.paid))} />
                        </Form.Group>
                    </td>
                )
            }
            tdList.push(
                <td>
                    <div className="actions-buttons">
                        <Button type="button" variant="warning" onClick={() => { }}>
                            <FontAwesomeIcon icon={faPen} onClick={() => { TransactionModal.open(transaction, transaction.sinvoices) }} />
                        </Button>
                        <Button type="button" variant="danger" onClick={() => { this.delete(transaction) }}>
                            <FontAwesomeIcon icon={faTrash} />
                        </Button>
                        <Button type="button" variant="primary" onClick={() => { RepeatTransactionModal.open(transaction) }}>
                            <FontAwesomeIcon icon={faSync} />
                        </Button>
                    </div>
                </td>
            )
            trList.push(<tr>{tdList}</tr>)
        }
        this.state.table_body = (
            <tbody>
                {trList}
            </tbody>
        )
        this.forceUpdate()
    }

    open(account, invoice = null, year = null, month = null) {
        this.last.account = account
        this.last.invoice = invoice
        this.last.year = year
        this.last.month = month

        this.state.show = true
        if (invoice) {
            this.type = 1
            this.sendJsonMessage({
                code: MessageReceiverEnum.TRANSACTIONS,
                type: TransactionTypeEnum.INVOICE,
                accountId: account.id,
                invoiceId: invoice.id
            });
            this.state.title = [`${account.id}/${account.description} - ${invoice.id}/${invoice.description} - `, <DateFormat value={invoice.debit_date} t={t} />]
            this.state.table_header = (
                <tr>
                    <th>{t('common.date')}</th>
                    <th>{t('common.description')}</th>
                    <th class="text-center">{t('transactions.value')}</th>
                    <th class="text-center">
                        {t('common.actions')}
                        <div className="actions-buttons">
                            <Button type="button" variant="primary" onClick={() => { TransactionModal.open({ account_id: account.id, invoice_id: invoice.id }, account.sinvoices) }}>
                                <FontAwesomeIcon icon={faPlus} />
                            </Button>
                        </div>
                    </th>
                </tr>
            )
        } else {
            this.type = 0
            this.sendJsonMessage({
                code: MessageReceiverEnum.TRANSACTIONS,
                type: TransactionTypeEnum.COMMON,
                accountId: account.id,
                year,
                month: month + 1
            });
            this.state.title = `${account.id}/${account.description} - ${month + 1}/${year}`
            this.state.table_header = (
                <tr>
                    <th>{t('common.date')}</th>
                    <th>{t('common.description')}</th>
                    <th class="text-center">{t('transactions.value')}</th>
                    <th class="text-center">{t('transactions.paid')}</th>
                    <th class="text-center">{t('common.actions')}</th>
                </tr>
            )
        }
        this.state.table_body = (
            <tbody>
                <tr>
                    <td colSpan={invoice ? 4 : 5}>
                        <ReactLoading className="loading" color="#000" type={'spin'} />
                    </td>
                </tr>
            </tbody>
        )
        if (invoice) {
            this.state.table_footer = (
                <tfoot>
                    <tr>
                        <td colSpan="3">
                            {t('accounts.totals_not_paid')}
                        </td>
                        <td>
                            <NumberFormat t={t} value={invoice.total_negative} />
                        </td>
                    </tr>
                    <tr>
                        <td colSpan="3">
                            {t('accounts.totals_paid')}
                        </td>
                        <td>
                            <NumberFormat t={t} value={invoice.total_positive} />
                        </td>
                    </tr>
                </tfoot>
            )
        }
        this.forceUpdate()
    }

    render() {
        return (
            <Modal show={this.state.show} onHide={() => this.hide()} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        {this.state.title}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Table striped bordered hover>
                        <thead>
                            {this.state.table_header}
                        </thead>
                        {this.state.table_body}
                        {this.state.table_footer}
                    </Table>
                </Modal.Body>
            </Modal>
        )
    }
}
export default {
    Elem,
    openInvoice: (account, invoice) => {
        instance.open(account, invoice)
    },
    openAccount: (account, year, month) => {
        instance.open(account, null, year, month)
    },
    update(transactions) {
        instance.update(transactions)
    },
    reload() {
        instance.reload()
    }
}