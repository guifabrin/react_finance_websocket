/* eslint-disable react/no-direct-mutation-state */
/* eslint-disable import/no-anonymous-default-export */
import { Button, Modal, Table } from 'react-bootstrap';
import { faPlus, faList, faPen, faTrash } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React from 'react';
import ReactLoading from 'react-loading';
import TransactionModal from './TransactionModal';
import TransactionsModal from './TransactionsModal';
import MessageReceiverEnum from '../../../enums/MessageReceiverEnum';
import CrudStatusEnum from '../../../enums/CrudStatusEnum';
import { NumberFormat } from '../../../formatters/NumberFormat';
import { DateFormat } from '../../../formatters/DateFormat';
import InvoiceModal from './InvoiceModal';

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
            account: {},
            show: false
        };
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

    delete(invoice) {
        this.sendJsonMessage({
            code: MessageReceiverEnum.INVOICE,
            id: invoice.id,
            status: CrudStatusEnum.REMOVE,
            accountId: invoice.account_id,
        });
    }

    reload() {
        if (this.state.show) {
            this.open(this.state.account)
        }
    }

    update(invoices) {
        const trList = []
        for (const invoice of invoices) {
            trList.push(
                <tr key={`invoice_${invoice.id}`}>
                    <td>{invoice.id}</td>
                    <td>{invoice.description}</td>
                    <td><DateFormat value={invoice.debit_date} t={t} /></td>
                    <td>
                        <NumberFormat t={t} value={invoice.total} />
                        <small className='hide-compact'>
                            <small>
                                <NumberFormat t={t} value={invoice.total_negative} />
                            </small>
                            <small>
                                <NumberFormat t={t} value={invoice.total_positive} />
                            </small>
                        </small>
                    </td>
                    <td>
                        <div className="actions-buttons">
                            <Button type="button" variant="primary" onClick={() => {
                                TransactionModal.open({
                                    account_id: invoice.account.id,
                                    invoice_id: invoice.id,
                                    date: new Date(),
                                    value: 0
                                },
                                    invoice.account.sinvoices)
                            }
                            }>
                                <FontAwesomeIcon icon={faPlus} />
                            </Button>
                            <Button type="button" variant="warning" onClick={() => InvoiceModal.open(invoice, invoice.account)}>
                                <FontAwesomeIcon icon={faPen} />
                            </Button>
                            <Button type="button" variant="danger" onClick={() => this.delete(invoice)}>
                                <FontAwesomeIcon icon={faTrash} />
                            </Button>
                            <Button type="button" variant="primary" onClick={() => TransactionsModal.openInvoice(invoice.account, invoice)}>
                                <FontAwesomeIcon icon={faList} />
                            </Button>
                        </div>
                    </td>
                </tr >
            )
        }
        this.state.table_body = (
            <tbody>
                {trList}
            </tbody>
        )
        this.forceUpdate()
    }

    open(account) {
        this.state.account = account
        this.state.show = true
        this.sendJsonMessage({
            code: MessageReceiverEnum.INVOICES,
            accountId: account.id
        });
        this.state.title = (`${account.id}/${account.description}`)
        this.state.table_body = (
            <tbody>
                <tr>
                    <td colSpan={5}>
                        <ReactLoading className="loading" color="#000" type={'spin'} />
                    </td>
                </tr>
            </tbody>
        )
        this.state.table_footer = ''
        this.forceUpdate()
    }

    render() {
        return (
            <Modal show={this.state.show} onHide={() => this.hide()} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>{this.state.title}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Table striped bordered hover>
                        <thead>
                            <tr class="active">
                                <th>{t('common.id')}</th>
                                <th>{t('common.description')}</th>
                                <th>{t('invoices.debit_date')}</th>
                                <th>{t('transactions.value')}</th>
                                <th>
                                    {t('common.actions')}
                                    <div className="actions-buttons">
                                        <Button type="button" variant="secondary" onClick={() => { }}>
                                            <FontAwesomeIcon icon={faPlus} />
                                        </Button>
                                    </div>
                                </th>
                            </tr>
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
    open: (account) => {
        instance.open(account)
    },
    update(invoices) {
        instance.update(invoices)
    },
    reload() {
        instance.reload()
    }
}