import React, { useState, useMemo, useRef, useEffect } from 'react';
import useWebSocket from 'react-use-websocket';
import { Table, Nav, Button, Modal } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSync, faList } from '@fortawesome/free-solid-svg-icons'
import imgBancoCaixa from '../assets/images/sync_banco_caixa.png'
import imgBancoDoBrasil from '../assets/images/sync_banco_do_brasil.png'
import imgBancoInter from '../assets/images/sync_banco_inter.png'
import imgBancoItua from '../assets/images/sync_banco_itau.png'
import imgBancoNuconta from '../assets/images/sync_banco_nuconta.png'
import imgSodexoAlimentacao from '../assets/images/sync_sodexo_alimentacao.png'
import { NumberFormat } from './NumberFormat';
import ReactLoading from 'react-loading';
const imgRef = {
    'sync_banco_caixa': imgBancoCaixa,
    'sync_banco_do_brasil': imgBancoDoBrasil,
    'sync_banco_inter': imgBancoInter,
    'sync_banco_itau': imgBancoItua,
    'sync_banco_nuconta': imgBancoNuconta,
    'sync_sodexo_alimentacao': imgSodexoAlimentacao,
}
const MessageEnum = Object.freeze({
    USER: 0,
    ACCOUNTS: 1,
    YEAR: 2,
    NOTIFICATIONS: 3,
    AUTOMATED: 4,
    CAPTCHA: 5,
    TRANSACTIONS: 6,
    INVOICES: 7
})
const TransactionTypeEnum = Object.freeze({
    COMMON: 0,
    INVOICE: 1
})
const SOCKET_URL = 'ws://localhost:8765/'
const PATH = btoa('guilherme.fabrin@gmail.com:$2y$10$8SIHjbAwDS/Cy4fVWwoPf.FM19.KrHAPrUrdWOp8ZGQdwLD/7Bxc2')

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

export const WebSocketComponent = ({ t, setNotifications, setCaptchaConfirmation, setUser, setReadyState }) => {
    const [socketUrl, setSocketUrl] = useState(SOCKET_URL + PATH);
    const [tableThead, setTableThead] = useState('')
    const [tableAccounts, setTableAccounts] = useState('')
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

    const {
        sendJsonMessage,
        lastMessage,
        readyState,
    } = useWebSocket(socketUrl, {
        onOpen: () => {
            sendJsonMessage({
                code: MessageEnum.YEAR,
                year: new Date().getFullYear()
            });
            setCaptchaConfirmation((id, value) => {
                sendJsonMessage({
                    code: MessageEnum.CAPTCHA,
                    value,
                    id
                });
            })
        },
        onMessage: (message) => {
            const json = JSON.parse(message.data)
            RECEIVERS[json.code](json)
        }
    });

    function changeActualYear(year) {
        sendJsonMessage({
            code: MessageEnum.YEAR,
            year
        });
    }

    function syncAccount(id) {
        sendJsonMessage({
            code: MessageEnum.AUTOMATED,
            id: id,
            body: ''
        });
    }

    function showTransactionsInvoice(account, invoice) {
        sendJsonMessage({
            code: MessageEnum.TRANSACTIONS,
            type: TransactionTypeEnum.INVOICE,
            accountId: account.id,
            invoiceId: invoice.id
        });
        setModalTransactionsTitle(`${account.id}/${account.description} - ${invoice.id}/${invoice.description} - ${invoice.debit_date}`)
        setModalTransactionsType(1)
        setModalTableTransactionsHeader(
            <tr>
                <th>{t('common.date')}</th>
                <th>{t('common.description')}</th>
                <th class="text-center">{t('transactions.value')}</th>
                <th class="text-center">{t('common.actions')}</th>
            </tr>
        )
        setModalTableTransactionsBody(
            <tbody>
                <tr>
                    <td colspan={4}>
                        <ReactLoading color="#000" type={'spin'} />
                    </td>
                </tr>
            </tbody>
        )
        setModalTableTransactionsFooter(
            <tfoot>
                <tr>
                    <td colspan="3">
                        {t('accounts.totals_not_paid')}
                    </td>
                    <td>
                        <NumberFormat t={t} value={invoice.total_negative} />
                    </td>
                </tr>
                <tr>
                    <td colspan="3">
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
            code: MessageEnum.TRANSACTIONS,
            type: TransactionTypeEnum.COMMON,
            accountId: account.id,
            year,
            month
        });
        setModalTransactionsTitle(`${account.id}/${account.description} - ${month}/${year}`)
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
                    <td colspan={5}>
                        <ReactLoading color="#000" type={'spin'} />
                    </td>
                </tr>
            </tbody>
        )
        setModalTableTransactionsFooter('')
        handleModalTransactions()
    }

    function showInvoices(account) {
        sendJsonMessage({
            code: MessageEnum.INVOICES,
            accountId: account.id
        });
        setModalInvoicesTitle(`${account.id}/${account.description}`)
        setModalTableInvoicesBody(
            <tbody>
                <tr>
                    <td colspan={5}>
                        <ReactLoading color="#000" type={'spin'} />
                    </td>
                </tr>
            </tbody>
        )
        setModalTableInvoicesFooter('')
        handleModalInvoices()
    }

    const RECEIVERS = Object.freeze({
        [MessageEnum.USER]: ({ user }) => {
            setUser(user)
        },
        [MessageEnum.ACCOUNTS]: ({ accounts }) => {
            const tThead = []
            const tAccounts = []
            for (let month = 0; month < 12; month++) {
                tThead.push(
                    <th key={`thead_${month}`}>
                        {t(`common.months.${month}`)} ({t('common.money_type')})
                    </th>
                )
            }
            setTableThead(tThead)
            for (const account of accounts) {
                const totals = []
                for (let month = 0; month < 12; month++) {
                    let values = []
                    if (account.is_credit_card) {
                        for (const invoice of account.invoices[month]) {
                            values.push(
                                <div key={`subtotal_${account.id}_${invoice.id}_${month}`}>
                                    <Button variant="link" onClick={() => showTransactionsInvoice(account, invoice)}>
                                        <NumberFormat t={t} value={invoice.total} />
                                        <small>
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
                        }
                    } else {
                        values.push(
                            <div key={`subtotal_${account.id}_${month}`}>
                                <Button variant="link" onClick={() => showTransactions(account, actualYear, month)}>
                                    <NumberFormat t={t} value={account.values[month]} />
                                </Button>
                            </div>
                        )
                    }
                    totals.push(<td key={`total_${account.id}_${month}`}>{values}</td>)
                }
                tAccounts.push(
                    <tr key={`account_${account.id}`}>
                        <th>
                            <div style={{ position: 'relative', overflow: 'hidden' }}>
                                {account.id}/{account.description}
                                {
                                    account.automated_ref &&
                                    <>
                                        <img src={imgRef[account.automated_ref]} alt="" className="accountImage" />
                                        <Button variant="primary" onClick={() => syncAccount(account.id)}>
                                            <FontAwesomeIcon icon={faSync} />
                                        </Button>
                                    </>
                                }
                                {
                                    account.is_credit_card &&
                                    <Button variant="secondary" onClick={() => showInvoices(account)}>
                                        <FontAwesomeIcon icon={faList} />
                                    </Button>
                                }
                            </div>
                        </th>
                        {totals}
                    </tr>
                )
            }
            setTableAccounts(tAccounts)
        },
        [MessageEnum.YEAR]: ({ year }) => {
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
        [MessageEnum.NOTIFICATIONS]: (data) => {
            setNotifications(data)
        },
        [MessageEnum.AUTOMATED]: (data) => {
            console.log(data)
        },
        [MessageEnum.TRANSACTIONS]: ({ transactions }) => {
            const trList = []
            for (const transaction of transactions) {
                const tdList = [
                    <td>{transaction.date}</td>,
                    <td>{transaction.description}</td>,
                    <td><NumberFormat t={t} value={transaction.value} /></td>
                ]
                if (modalTransactionsType === 0) {
                    tdList.push(<td><input type="checkbox" /></td>)
                }
                tdList.push(<td></td>)
                trList.push(<tr>{tdList}</tr>)
            }
            setModalTableTransactionsBody(trList)
        },
        [MessageEnum.INVOICES]: ({ invoices }) => {
            const trList = []
            for (const invoice of invoices) {
                trList.push(
                    <tr>

                        <td>{invoice.id}</td>
                        <td>{invoice.description}</td>
                        <td>{invoice.debit_date}</td>
                        <td>
                            <NumberFormat t={t} value={invoice.total} />
                        </td>
                        <td>
                            <Button variant="primary" onClick={() => showTransactionsInvoice(invoice.account, invoice)}>
                                <FontAwesomeIcon icon={faList} />
                            </Button>
                        </td>
                    </tr>
                )
            }
            setModalTableInvoicesBody(trList)
        }
    })

    messageHistory.current = useMemo(() =>
        messageHistory.current.concat(lastMessage), [lastMessage]);

    useEffect(() => {
        setSocketUrl(SOCKET_URL + PATH)
    }, [])
    setReadyState(readyState)

    return (
        <div>
            <Modal show={showModalTransactions} onHide={handleCloseModalTransactions} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>{modalTransactionsTitle}</Modal.Title>
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
                                <th>{t('common.value')}</th>
                                <th>{t('common.actions')}</th>
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
                        <th>{t(`common.description`)}</th>
                        {tableThead}
                    </tr>
                </thead>
                <tbody>
                    {tableAccounts}
                </tbody>
            </Table>
        </div>
    );
};