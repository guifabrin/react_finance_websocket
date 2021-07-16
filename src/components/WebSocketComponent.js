import "react-datepicker/dist/react-datepicker.css";
import { DateFormat } from './DateFormat';
import { faSync, faList, faPen, faTrash, faPlus, faSave } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { NumberFormat } from './NumberFormat';
import { Table, Nav, Button, Modal, Form } from 'react-bootstrap';
import CrudStatusEnum from "../enums/CrudStatusEnum";
import DatePicker from "react-datepicker";
import imgBancoCaixa from '../assets/images/sync_banco_caixa.png'
import imgBancoDoBrasil from '../assets/images/sync_banco_do_brasil.png'
import imgBancoInter from '../assets/images/sync_banco_inter.png'
import imgBancoItau from '../assets/images/sync_banco_itau.png'
import imgBancoNuconta from '../assets/images/sync_banco_nuconta.png'
import imgSodexoAlimentacao from '../assets/images/sync_sodexo_alimentacao.png'
import MessageReceiverEnum from "../enums/MessageReceiverEnum";
import NumberFormatOriginal from 'react-number-format';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import ReactLoading from 'react-loading';
import TransactionTypeEnum from "../enums/TransactionTypeEnum";
import useWebSocket from 'react-use-websocket';
import AccountModal from "../modals/AccountModal";

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

    const [modalTransactionsTitle, setModalTransactionsTitle] = useState('')
    const [modalTransactionsType, setModalTransactionsType] = useState(0)
    const [modalTableTransactionsHeader, setModalTableTransactionsHeader] = useState('')
    const [modalTableTransactionsFooter, setModalTableTransactionsFooter] = useState('')
    const [modalTableTransactionsBody, setModalTableTransactionsBody] = useState('')
    const [showModalTransactions, setShowModalTransactions] = useState(false);
    const handleCloseModalTransactions = () => setShowModalTransactions(false);
    const handleModalTransactions = () => setShowModalTransactions(true);


    const [modalInvoicesTitle, setModalInvoicesTitle] = useState('')
    const [modalTableInvoicesFooter, setModalTableInvoicesFooter] = useState('')
    const [modalTableInvoicesBody, setModalTableInvoicesBody] = useState('')
    const [showModalInvoices, setShowModalInvoices] = useState(false);
    const handleCloseModalInvoices = () => setShowModalInvoices(false);
    const handleModalInvoices = () => setShowModalInvoices(true);


    const [showModalTransaction, setShowModalTransaction] = useState(false);
    const [formTransaction, setFormTransaction] = useState({})
    const [formTransactionInvoices, setFormTransactionInvoices] = useState([])
    const handleCloseModalTransaction = () => setShowModalTransaction(false);
    const handleModalTransaction = () => setShowModalTransaction(true);

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
        sendJsonMessage({
            code: MessageReceiverEnum.TRANSACTIONS,
            type: TransactionTypeEnum.INVOICE,
            accountId: account.id,
            invoiceId: invoice.id
        });
        setModalTransactionsTitle([`${account.id}/${account.description} - ${invoice.id}/${invoice.description} - `, <DateFormat value={invoice.debit_date} t={t} />])
        setModalTransactionsType(1)
        setModalTableTransactionsHeader(
            <tr>
                <th>{t('common.date')}</th>
                <th>{t('common.description')}</th>
                <th class="text-center">{t('transactions.value')}</th>
                <th class="text-center">
                    {t('common.actions')}
                    <div className="actions-buttons">
                        <Button type="button" variant="primary" onClick={() => { openModalTransaction({ account_id: account.id, invoice_id: invoice.id }, account.sinvoices) }}>
                            <FontAwesomeIcon icon={faPlus} />
                        </Button>
                    </div>
                </th>
            </tr>
        )
        setModalTableTransactionsBody(
            <tbody>
                <tr>
                    <td colSpan={4}>
                        <ReactLoading className="loading" color="#000" type={'spin'} />
                    </td>
                </tr>
            </tbody>
        )
        setModalTableTransactionsFooter(
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
        handleModalTransactions()
    }

    function showTransactions(account, year, month) {
        sendJsonMessage({
            code: MessageReceiverEnum.TRANSACTIONS,
            type: TransactionTypeEnum.COMMON,
            accountId: account.id,
            year,
            month: month + 1
        });
        setModalTransactionsTitle(`${account.id}/${account.description} - ${month + 1}/${year}`)
        setModalTransactionsType(0)
        setModalTableTransactionsHeader(
            <tr>
                <th>{t('common.date')}</th>
                <th>{t('common.description')}</th>
                <th class="text-center">{t('transactions.value')}</th>
                <th class="text-center">{t('transactions.paid')}</th>
                <th class="text-center">{t('common.actions')}</th>
            </tr>
        )
        setModalTableTransactionsBody(
            <tbody>
                <tr>
                    <td colSpan={5}>
                        <ReactLoading className="loading" color="#000" type={'spin'} />
                    </td>
                </tr>
            </tbody>
        )
        setModalTableTransactionsFooter('')
        handleModalTransactions()
    }

    function showInvoices(account) {
        sendJsonMessage({
            code: MessageReceiverEnum.INVOICES,
            accountId: account.id
        });
        setModalInvoicesTitle(`${account.id}/${account.description}`)
        setModalTableInvoicesBody(
            <tbody>
                <tr>
                    <td colSpan={5}>
                        <ReactLoading className="loading" color="#000" type={'spin'} />
                    </td>
                </tr>
            </tbody>
        )
        setModalTableInvoicesFooter('')
        handleModalInvoices()
    }

    function setPaid(transaction, paid) {
        transaction.paid = paid
        sendJsonMessage({
            code: MessageReceiverEnum.TRANSACTION,
            status: CrudStatusEnum.ADD_EDIT,
            id: transaction.id,
            accountId: transaction.account_id,
            values: {
                paid
            }
        });
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
            const trList = []
            for (const transaction of transactions) {
                const tdList = [
                    <td><DateFormat value={transaction.date} t={t} /></td>,
                    <td>{transaction.description}</td>,
                    <td><NumberFormat t={t} value={transaction.value} /></td>
                ]
                if (modalTransactionsType === 0) {
                    tdList.push(
                        <td>
                            <Form.Group>
                                <Form.Check type="checkbox" checked={Boolean(transaction.paid)} onChange={() => setPaid(transaction, !Boolean(transaction.paid))} />
                            </Form.Group>
                        </td>
                    )
                }
                tdList.push(
                    <td>
                        <div className="actions-buttons">
                            <Button type="button" variant="warning" onClick={() => { }}>
                                <FontAwesomeIcon icon={faPen} onClick={() => { openModalTransaction(transaction, transaction.sinvoices) }} />
                            </Button>
                            <Button type="button" variant="danger" onClick={() => { deleteTransaction(transaction) }}>
                                <FontAwesomeIcon icon={faTrash} />
                            </Button>
                        </div>
                    </td>
                )
                trList.push(<tr>{tdList}</tr>)
            }
            setModalTableTransactionsBody(
                <tbody>
                    {trList}
                </tbody>
            )
        },
        [MessageReceiverEnum.INVOICES]: ({ invoices }) => {
            const trList = []
            for (const invoice of invoices) {
                trList.push(
                    <tr>
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
                                <Button type="button" variant="primary" onClick={() => { openModalTransaction({ account_id: invoice.account.id, invoice_id: invoice.id }, invoice.account.sinvoices) }}>
                                    <FontAwesomeIcon icon={faPlus} />
                                </Button>
                                <Button type="button" variant="primary" onClick={() => showTransactionsInvoice(invoice.account, invoice)}>
                                    <FontAwesomeIcon icon={faList} />
                                </Button>
                            </div>
                        </td>
                    </tr >
                )
            }
            setModalTableInvoicesBody(
                <tbody>
                    {trList}
                </tbody>
            )
        },
        [MessageReceiverEnum.UPDATE]: () => {
            changeActualYear(actualYear)
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
        setFormTransaction(transaction)
        const lList = [
            <option>Selecionar fatura</option>
        ]
        for (const invoice of invoices)
            lList.push(<option key={`invoice_option_${invoice.id}`} value={invoice.id}>{invoice.id}/{invoice.description}</option>)
        setFormTransactionInvoices(lList)
        handleModalTransaction()
    }

    function updateFormTransaction(property, value) {
        const clone = Object.assign({}, formTransaction);
        clone[property] = value
        setFormTransaction(clone)
    }

    function saveFormTransaction() {
        const clone = Object.assign({}, formTransaction);
        clone.date = `${clone.date.getFullYear()}-${((clone.date.getMonth() + 1) + '').padStart(2, '0')}-${(clone.date.getDate() + '').padStart(2, '0')}`
        sendJsonMessage({
            code: MessageReceiverEnum.TRANSACTION,
            id: clone.id,
            status: CrudStatusEnum.ADD_EDIT,
            accountId: clone.account_id,
            values: clone
        });
        handleCloseModalTransaction()
    }

    function deleteAccount(account) {
        sendJsonMessage({
            code: MessageReceiverEnum.ACCOUNT,
            status: CrudStatusEnum.REMOVE,
            value: account
        });
        handleCloseModalTransactions()
    }

    function deleteTransaction(transaction) {
        sendJsonMessage({
            code: MessageReceiverEnum.TRANSACTION,
            id: transaction.id,
            status: CrudStatusEnum.REMOVE,
            accountId: transaction.account_id,
        });
        handleCloseModalTransactions()
    }
    return (
        <div>
            <h2>
                {t('accounts.title')}
            </h2>
            <AccountModal.Elem t={t} accounts={mainAccounts} sendJsonMessage={sendJsonMessage} />
            <Modal show={showModalTransaction} onHide={handleCloseModalTransaction} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        {formTransaction.id ? t('common.edit') : t('common.add')} {t('accounts.title')}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group>
                            <Form.Label>{t('common.id')}</Form.Label>
                            <Form.Control type="number" value={formTransaction.id} disabled />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>{t('common.description')}</Form.Label>
                            <Form.Control type="text" value={formTransaction.description} onChange={(event) => updateFormTransaction('description', event.target.value)} />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>{t('common.date')}</Form.Label>
                            <DatePicker className='form-control' type="text" selected={formTransaction.date ? new Date(formTransaction.date) : new Date()} onChange={(value) => updateFormTransaction('date', value)} />
                        </Form.Group>
                        {
                            formTransactionInvoices.length > 0 &&
                            <>
                                <Form.Label>{t('transactions.invoice')}</Form.Label>
                                <Form.Group>
                                    <select value={formTransaction.invoice_id} onChange={(event) => { updateFormTransaction('invoice_id', event.target.value) }} className="form-control">
                                        {formTransactionInvoices}
                                    </select>
                                </Form.Group>
                            </>
                        }
                        <Form.Group>
                            <Form.Check type="checkbox" label={t('transactions.paid')} checked={Boolean(formTransaction.paid)} onChange={(event) => updateFormTransaction('paid', event.target.checked)} />
                        </Form.Group>
                        <Form.Group>
                            <NumberFormatOriginal className="form-control" value={formTransaction.value} onChange={(event) => { updateFormTransaction('value', parseFloat(event.target.value)) }} />
                        </Form.Group>
                        <Button type="button" variant="primary" onClick={() => {
                            saveFormTransaction(formTransaction)
                        }}>
                            <FontAwesomeIcon icon={faSave} />
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>

            <Modal show={showModalTransactions} onHide={handleCloseModalTransactions} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        {modalTransactionsTitle}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Table striped bordered hover>
                        <thead>
                            {modalTableTransactionsHeader}
                        </thead>
                        {modalTableTransactionsBody}
                        {modalTableTransactionsFooter}
                    </Table>
                </Modal.Body>
            </Modal>
            <Modal show={showModalInvoices} onHide={handleCloseModalInvoices} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>{modalInvoicesTitle}</Modal.Title>
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
                        {modalTableInvoicesBody}
                        {modalTableInvoicesFooter}
                    </Table>
                </Modal.Body>
            </Modal>
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