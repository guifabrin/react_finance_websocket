import React, { useState, useMemo, useRef, useEffect } from 'react';
import useWebSocket from 'react-use-websocket';
import NumberFormat from 'react-number-format';
import { Table, Nav, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSync } from '@fortawesome/free-solid-svg-icons'
import imgBancoCaixa from '../assets/images/sync_banco_caixa.png'
import imgBancoDoBrasil from '../assets/images/sync_banco_do_brasil.png'
import imgBancoInter from '../assets/images/sync_banco_inter.png'
import imgBancoItua from '../assets/images/sync_banco_itau.png'
import imgBancoNuconta from '../assets/images/sync_banco_nuconta.png'
import imgSodexoAlimentacao from '../assets/images/sync_sodexo_alimentacao.png'
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
    CAPTCHA: 5
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
                                    <NumberFormat value={invoice.total} displayType={'text'} thousandSeparator={true} decimalScale={2} />
                                    <small>
                                        <small>
                                            <NumberFormat value={invoice.total_negative} displayType={'text'} thousandSeparator={true} decimalScale={2} />
                                        </small>
                                        <small>
                                            <NumberFormat value={invoice.total_positive} displayType={'text'} thousandSeparator={true} decimalScale={2} />
                                        </small>
                                    </small>
                                </div>
                            )
                        }
                    } else {
                        values.push(
                            <div key={`subtotal_${account.id}_${month}`}>
                                <NumberFormat value={account.values[month]} displayType={'text'} thousandSeparator={true} decimalScale={2} />
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