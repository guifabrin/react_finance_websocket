/* eslint-disable no-loop-func */
import "react-datepicker/dist/react-datepicker.css";
import { faSync, faList, faPen, faTrash, faPlus } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { NumberFormat } from '../formatters/NumberFormat';
import { Table, Nav, Button } from 'react-bootstrap';
import AccountModal from "./modals/AccountModal";
import CrudStatusEnum from "../enums/CrudStatusEnum";
import imgBancoCaixa from '../assets/images/sync_banco_caixa.png'
import imgBancoDoBrasil from '../assets/images/sync_banco_do_brasil.png'
import imgBancoInter from '../assets/images/sync_banco_inter.png'
import imgBancoItau from '../assets/images/sync_banco_itau.png'
import imgBancoNuconta from '../assets/images/sync_banco_nuconta.png'
import imgSodexoAlimentacao from '../assets/images/sync_sodexo_alimentacao.png'
import MessageReceiverEnum from "../enums/MessageReceiverEnum";
import React, { useState, useMemo, useRef, useEffect } from 'react';
import ReactLoading from 'react-loading';
import useWebSocket from 'react-use-websocket';
import TransactionModal from "./modals/TransactionModal";
import TransactionsModal from "./modals/TransactionsModal";
import InvoicesModal from "./modals/InvoicesModal";

const imgRef = {
    'sync_banco_caixa': imgBancoCaixa,
    'sync_banco_do_brasil': imgBancoDoBrasil,
    'sync_banco_inter': imgBancoInter,
    'sync_banco_itau': imgBancoItau,
    'sync_banco_nuconta': imgBancoNuconta,
    'sync_sodexo_alimentacao': imgSodexoAlimentacao,
}

const SOCKET_URL = 'ws://localhost:8765/'
const PATH = btoa('guilherme.fabrin@gmail.com:$2y$10$8SIHjbAwDS/Cy4fVWwoPf.FM19.KrHAPrUrdWOp8ZGQdwLD/7Bxc2')
const now = new Date();

function getListYear(fromDate) {
    const years = [];
    const nowYear = new Date().getFullYear();
    const yearDiff = (nowYear - fromDate);
    let j = 10 - yearDiff;
    if (j <= 0) {
        j = 1;
    }
    for (let i = fromDate - j; i <= fromDate; i++) {
        years.push(i);
    }
    if (fromDate < nowYear) {
        for (let i = fromDate + 1; i <= nowYear; i++) {
            years.push(i);
        }
    }
    return years;
}

let mainAccounts = []

export const WebSocketComponent = ({ t, setNotifications, setCaptchaConfirmation, setConfigSender, setUser, setReadyState, setNotificationSender }) => {
    const [socketUrl, setSocketUrl] = useState(SOCKET_URL + PATH);
    const [tableThead, setTableThead] = useState('')
    const [tableAccounts, setTableAccounts] = useState('')
    const [tableFooter, setTableFooter] = useState('')
    const [listYears, setListYears] = useState('')
    const [actualYear, setActualYear] = useState('')

    const messageHistory = useRef([]);

    const {
        sendJsonMessage,
        lastMessage,
        readyState,
    } = useWebSocket(socketUrl, {
        onOpen: () => {
            changeActualYear(new Date().getFullYear())
            setCaptchaConfirmation((id, value) => {
                sendJsonMessage({
                    code: MessageReceiverEnum.CAPTCHA,
                    value,
                    id
                });
            })
            setConfigSender((id, value) => {
                sendJsonMessage({
                    code: MessageReceiverEnum.CONFIG,
                    value,
                    id
                });
            })
            setNotificationSender((id) => {
                sendJsonMessage({
                    code: MessageReceiverEnum.NOTIFICATION,
                    id
                });
            })
        },
        onMessage: (message) => {
            const json = JSON.parse(message.data)
            RECEIVERS[json.code](json)
        },
        shouldReconnect: (closeEvent) => true,
    });

    function changeActualYear(year) {
        sendJsonMessage({
            code: MessageReceiverEnum.YEAR,
            year
        });
        const tThead = []
        for (let month = 0; month < 12; month++) {
            tThead.push(
                <th key={`thead_${month}`} className={actualYear === now.getFullYear() && month === now.getMonth() ? 'table-active' : ''}>
                    {t(`common.months.${month}`)} ({t('common.money_type')})
                </th>
            )
        }
        setTableThead(tThead)
        setTableFooter('')
        setTableAccounts(
            <tr>
                <td colSpan={13}>
                    <ReactLoading className="loading" color="#000" type={'spin'} />
                </td>
            </tr>
        )
    }

    function syncAccount(account) {
        let body = ''
        if (account.automated_body) {
            body = prompt('isafe?')
        }
        sendJsonMessage({
            code: MessageReceiverEnum.AUTOMATED,
            id: account.id,
            body
        });
    }

    function showTransactionsInvoice(account, invoice) {
        TransactionsModal.openInvoice(account, invoice)
    }

    function showTransactions(account, year, month) {
        TransactionsModal.openAccount(account, year, month)
    }

    function showInvoices(account) {
        InvoicesModal.open(account)
    }

    const RECEIVERS = Object.freeze({
        [MessageReceiverEnum.USER]: ({ user }) => {
            setUser(user)
        },
        [MessageReceiverEnum.ACCOUNTS]: ({ accounts }) => {
            mainAccounts = accounts
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
                                <div key={`subtotal_${account.id}_${invoice.id}_${month}`}>
                                    <Button type="button" variant="link" onClick={() => showTransactionsInvoice(account, invoice)}>
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
                                <Button type="button" variant="primary" onClick={() => { openModalTransaction({ account_id: account.id }) }}>
                                    <FontAwesomeIcon icon={faPlus} />
                                </Button>
                                <Button type="button" variant="link" onClick={() => showTransactions(account, actualYear, month)}>
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
                    totals.push(<td className={actualYear === now.getFullYear() && month === now.getMonth() ? 'table-active' : ''} key={`total_${account.id}_${month}`}>{values}</td>)
                }
                tAccounts.push(
                    <tr key={`account_${account.id}`} className={account.ignore ? 'ignored hide-compact' : ''}>
                        <th>
                            <div style={{ position: 'relative', overflow: 'hidden' }}>
                                {account.id}/{account.description}
                                <div className="actions-buttons">
                                    <Button type="button" variant="danger" onClick={() => { deleteAccount(account) }}>
                                        <FontAwesomeIcon icon={faTrash} />
                                    </Button>
                                    <Button type="button" variant="warning" onClick={() => { }}>
                                        <FontAwesomeIcon icon={faPen} onClick={() => AccountModal.open(account, mainAccounts)} />
                                    </Button>
                                    {
                                        account.automated_ref &&
                                        <>
                                            <img src={imgRef[account.automated_ref]} alt="" className="accountImage" />
                                            <Button type="button" variant="primary" onClick={() => syncAccount(account)}>
                                                <FontAwesomeIcon icon={faSync} />
                                            </Button>
                                        </>
                                    }
                                    {
                                        Boolean(account.is_credit_card) &&
                                        <>
                                            <Button type="button" variant="secondary" onClick={() => showInvoices(account)}>
                                                <FontAwesomeIcon icon={faList} />
                                            </Button>
                                            <Button type="button" variant="secondary" onClick={() => { }}>
                                                <FontAwesomeIcon icon={faPlus} />
                                            </Button>
                                        </>
                                    }
                                    {

                                        !Boolean(account.is_credit_card) &&
                                        <Button type="button" variant="primary" onClick={() => { openModalTransaction({ account_id: account.id }) }}>
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
            setTableAccounts(tAccounts)

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
                    <th className={actualYear === now.getFullYear() && month === now.getMonth() ? 'table-active' : ''}>
                        <NumberFormat t={t} value={sumTotals[month]} />
                    </th>
                )
                tdListNotPaid.push(
                    <th className={actualYear === now.getFullYear() && month === now.getMonth() ? 'table-active' : ''}>
                        <NumberFormat t={t} value={sumTotalsNotPaid[month]} />
                    </th>
                )
                tdListSumPaid.push(
                    <th className={actualYear === now.getFullYear() && month === now.getMonth() ? 'table-active' : ''}>
                        <NumberFormat t={t} value={sumTotals[month] + sumTotalsNotPaid[month]} />
                    </th>
                )
            }
            setTableFooter(
                <tfoot>
                    <tr>
                        {tdListPaid}
                    </tr>
                    <tr>
                        {tdListNotPaid}
                    </tr>
                    <tr>
                        {tdListSumPaid}
                    </tr>
                </tfoot>
            )
        },
        [MessageReceiverEnum.YEAR]: ({ year }) => {
            setActualYear(year)
            const years = getListYear(year)
            const lYears = []
            for (const y of years) {
                lYears.push(
                    <Nav.Item>
                        <Nav.Link eventKey={y} onSelect={() => changeActualYear(y)}>{y}</Nav.Link>
                    </Nav.Item>
                )
            }
            setListYears(lYears)
        },
        [MessageReceiverEnum.NOTIFICATIONS]: (data) => {
            setNotifications(data)
        },
        [MessageReceiverEnum.AUTOMATED]: (data) => {
            console.log(data)
        },
        [MessageReceiverEnum.TRANSACTIONS]: ({ transactions }) => {
            TransactionsModal.update(transactions)
        },
        [MessageReceiverEnum.INVOICES]: ({ invoices }) => {
            InvoicesModal.update(invoices)
        },
        [MessageReceiverEnum.UPDATE]: () => {
            changeActualYear(actualYear)
            TransactionsModal.reload()
        }
    })

    messageHistory.current = useMemo(() => {
        return messageHistory.current.concat(lastMessage)
    }, [lastMessage]);

    useEffect(() => {
        setSocketUrl(SOCKET_URL + PATH)
    }, [])
    setReadyState(readyState)

    function openModalTransaction(transaction, invoices = []) {
        if (!transaction.date) {
            transaction.date = new Date()
        } else {
            if (typeof transaction.date == "string") {
                transaction.date = new Date(transaction.date)
            }
        }
        if (!transaction.value) {
            transaction.value = 0
        }
        TransactionModal.open(transaction, invoices)
    }

    function deleteAccount(account) {
        sendJsonMessage({
            code: MessageReceiverEnum.ACCOUNT,
            status: CrudStatusEnum.REMOVE,
            value: account
        });
    }
    return (
        <div>
            <h2>
                {t('accounts.title')}
            </h2>
            <AccountModal.Elem t={t} accounts={mainAccounts} sendJsonMessage={sendJsonMessage} />
            <TransactionModal.Elem t={t} sendJsonMessage={sendJsonMessage} />
            <TransactionsModal.Elem t={t} sendJsonMessage={sendJsonMessage} />
            <InvoicesModal.Elem t={t} sendJsonMessage={sendJsonMessage} />
            <Nav variant="tabs" activeKey={actualYear}>
                {listYears}
            </Nav>
            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>
                            {t(`common.description`)}
                            <div className="actions-buttons">
                                <Button type="button" variant="primary" onClick={() => { AccountModal.open({}, mainAccounts) }}>
                                    <FontAwesomeIcon icon={faPlus} />
                                </Button>
                            </div>
                        </th>
                        {tableThead}
                    </tr>
                </thead>
                <tbody>
                    {tableAccounts}
                </tbody>
                {tableFooter}
            </Table>
        </div >
    );
};