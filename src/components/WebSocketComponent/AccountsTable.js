/* eslint-disable react/no-direct-mutation-state */
/* eslint-disable import/no-anonymous-default-export */
import { Button, Table } from 'react-bootstrap';
import { faPlus, faPen, faTrash, faSync, faList } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import CrudStatusEnum from '../../enums/CrudStatusEnum';
import MessageReceiverEnum from '../../enums/MessageReceiverEnum';
import React from 'react';
import { NumberFormat } from '../../formatters/NumberFormat';
import TransactionModal from './modals/TransactionModal';
import TransactionsModal from './modals/TransactionsModal';
import YearTab from './YearTab';
import AccountModal from './modals/AccountModal';
import InvoicesModal from './modals/InvoicesModal';
import ReactLoading from 'react-loading';

import imgBancoCaixa from '../../assets/images/sync_banco_caixa.png'
import imgBancoDoBrasil from '../../assets/images/sync_banco_do_brasil.png'
import imgBancoInter from '../../assets/images/sync_banco_inter.png'
import imgBancoItau from '../../assets/images/sync_banco_itau.png'
import imgBancoNuconta from '../../assets/images/sync_banco_nuconta.png'
import imgSodexoAlimentacao from '../../assets/images/sync_sodexo_alimentacao.png'
import InvoiceModal from './modals/InvoiceModal';

const imgRef = {
    'sync_banco_caixa': imgBancoCaixa,
    'sync_banco_do_brasil': imgBancoDoBrasil,
    'sync_banco_inter': imgBancoInter,
    'sync_banco_itau': imgBancoItau,
    'sync_banco_nuconta': imgBancoNuconta,
    'sync_sodexo_alimentacao': imgSodexoAlimentacao,
}
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
            accounts: []
        };
        instance = this
    }


    sync(account) {
        let body = ''
        if (account.automated_body) {
            body = prompt('isafe?')
        }
        this.sendJsonMessage({
            code: MessageReceiverEnum.AUTOMATED,
            id: account.id,
            body
        });
    }

    delete(account) {
        this.sendJsonMessage({
            code: MessageReceiverEnum.ACCOUNT,
            status: CrudStatusEnum.REMOVE,
            value: account
        });
    }

    update(accounts) {
        this.state.accounts = accounts;
        const tAccounts = []
        const sumTotals = []
        const sumTotalsNotPaid = []
        for (const account of accounts) {
            const totals = []
            for (let month = 0; month < 12; month++) {
                if (!sumTotals[month]) {
                    sumTotals[month] = 0
                }
                if (!sumTotalsNotPaid[month]) {
                    sumTotalsNotPaid[month] = 0
                }
                let values = []
                if (account.is_credit_card) {
                    for (const invoice of account.invoices[month]) {
                        values.push(
                            <div key={`subtotal_${account.id}_${invoice.id}_${month}`} className="actions-buttons">
                                <Button type="button" variant="link" onClick={() => TransactionsModal.openInvoice(account, invoice)}>
                                    <NumberFormat t={t} value={invoice.total} />
                                    <small className='hide-compact'>
                                        <small>
                                            <NumberFormat t={t} value={invoice.total_negative} />
                                        </small>
                                        <small>
                                            <NumberFormat t={t} value={invoice.total_positive} />
                                        </small>
                                    </small>
                                </Button>
                            </div>
                        )
                        if (!account.ignore)
                            sumTotals[month] += invoice.total
                    }
                } else {
                    values.push(
                        <div key={`subtotal_${account.id}_${month}`} className="actions-buttons">
                            <Button type="button" variant="primary" onClick={() => { TransactionModal.open({ date: new Date(), value: 0, account_id: account.id }) }}>
                                <FontAwesomeIcon icon={faPlus} />
                            </Button>
                            <Button type="button" variant="link" onClick={() => TransactionsModal.openAccount(account, YearTab.year, month)}>
                                <NumberFormat t={t} value={account.values[month]} />
                                <small className='hide-compact'>
                                    <NumberFormat t={t} value={account.values_not_paid[month]} />
                                </small>
                            </Button>
                        </div>
                    )
                    if (!account.ignore)
                        sumTotals[month] += account.values[month]
                    if (!account.ignore)
                        sumTotalsNotPaid[month] += account.values_not_paid[month]
                }
                totals.push(<td className={YearTab.isNow(month) ? 'table-active' : ''} key={`total_${account.id}_${month}`}>{values}</td>)
            }
            tAccounts.push(
                <tr key={`account_${account.id}`} className={account.ignore ? 'ignored hide-compact' : ''}>
                    <th>
                        <div style={{ position: 'relative', overflow: 'hidden' }}>
                            {account.id}/{account.description}
                            <div className="actions-buttons">
                                <Button type="button" variant="danger" onClick={() => { this.delete(account) }}>
                                    <FontAwesomeIcon icon={faTrash} />
                                </Button>
                                <Button type="button" variant="warning" onClick={() => { }}>
                                    <FontAwesomeIcon icon={faPen} onClick={() => AccountModal.open(account, accounts)} />
                                </Button>
                                {
                                    account.automated_ref &&
                                    <>
                                        <img src={imgRef[account.automated_ref]} alt="" className="accountImage" />
                                        <Button type="button" variant="primary" onClick={() => this.sync(account)} disabled={account.sync === 'init'}>
                                            {account.sync === 'init' && <FontAwesomeIcon icon={faSync} spin />}
                                            {account.sync !== 'init' && <FontAwesomeIcon icon={faSync} />}
                                        </Button>
                                    </>
                                }
                                {
                                    Boolean(account.is_credit_card) &&
                                    <>
                                        <Button type="button" variant="secondary" onClick={() => InvoicesModal.open(account)}>
                                            <FontAwesomeIcon icon={faList} />
                                        </Button>
                                        <Button type="button" variant="secondary" onClick={() => { InvoiceModal.open({ account_id: account.id }, account) }}>
                                            <FontAwesomeIcon icon={faPlus} />
                                        </Button>
                                    </>
                                }
                                {

                                    !Boolean(account.is_credit_card) &&
                                    <Button type="button" variant="primary" onClick={() => { TransactionModal.open({ date: new Date(), value: 0, account_id: account.id }) }}>
                                        <FontAwesomeIcon icon={faPlus} />
                                    </Button>
                                }
                            </div>
                        </div>
                    </th>
                    {totals}
                </tr>
            )
        }
        this.state.table_body = (tAccounts)

        const tdListPaid = [
            <th>
                {t('accounts.totals_paid')}:
            </th>
        ]
        const tdListNotPaid = [
            <th>
                {t('accounts.totals_not_paid')}:
            </th>]
        const tdListSumPaid = [
            <th>
                {t('accounts.totals')}:
            </th>
        ]
        for (let month = 0; month < 12; month++) {
            tdListPaid.push(
                <th key={`totals_${month}`} className={YearTab.isNow(month) ? 'table-active' : ''}>
                    <NumberFormat t={t} value={sumTotals[month]} />
                </th>
            )
            tdListNotPaid.push(
                <th key={`totals_not_paid_${month}`} className={YearTab.isNow(month) ? 'table-active' : ''}>
                    <NumberFormat t={t} value={sumTotalsNotPaid[month]} />
                </th>
            )
            tdListSumPaid.push(
                <th key={`totals_paid_${month}`} className={YearTab.isNow(month) ? 'table-active' : ''}>
                    <NumberFormat t={t} value={sumTotals[month] + sumTotalsNotPaid[month]} />
                </th>
            )
        }
        this.state.table_footer = (
            <tfoot key={-1}>
                <tr key={0}>
                    {tdListPaid}
                </tr>
                <tr key={1}>
                    {tdListNotPaid}
                </tr>
                <tr key={2}>
                    {tdListSumPaid}
                </tr>
            </tfoot>
        )
        this.forceUpdate()
    }

    loading() {
        const tThead = []
        for (let month = 0; month < 12; month++) {
            tThead.push(
                <th key={`thead_${month}`} className={YearTab.isNow(month) ? 'table-active' : ''}>
                    {t(`common.months.${month}`)} ({t('common.money_type')})
                </th>
            )
        }
        this.state.table_header = (tThead)
        this.state.table_footer = ('')
        this.state.table_body = (
            <tr>
                <td colSpan={13}>
                    <ReactLoading className="loading" color="#000" type={'spin'} />
                </td>
            </tr>
        )
    }

    render() {
        return (
            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>
                            {t(`common.description`)}
                            <div className="actions-buttons">
                                <Button type="button" variant="primary" onClick={() => { AccountModal.open({}, this.state.accounts) }}>
                                    <FontAwesomeIcon icon={faPlus} />
                                </Button>
                            </div>
                        </th>
                        {this.state.table_header}
                    </tr>
                </thead>
                <tbody>
                    {this.state.table_body}
                </tbody>
                {this.state.table_footer}
            </Table>
        )
    }
}
export default {
    Elem,
    update(accounts) {
        instance.update(accounts)
    },
    loading() {
        instance.loading()
    }
}