import React, { useState, useMemo, useRef, useEffect } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import NumberFormat from 'react-number-format';
import { Table } from 'react-bootstrap';

const MessageEnum = Object.freeze({
    AUTH: 0,
    ACCOUNTS: 1,
    YEAR: 2
})
const SOCKET_URL = 'ws://localhost:8765/'
const PATH = btoa('guilherme.fabrin@gmail.com:$2y$10$8SIHjbAwDS/Cy4fVWwoPf.FM19.KrHAPrUrdWOp8ZGQdwLD/7Bxc2')

export const WebSocketComponent = ({ t }) => {
    const [socketUrl, setSocketUrl] = useState(SOCKET_URL + PATH);
    const [tableThead, setTableThead] = useState('')
    const [tableAccounts, setTableAccounts] = useState('')
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
        },
        onMessage: (message) => {
            const json = JSON.parse(message.data)
            RECEIVERS[json.code](json)
        },
        onClose: () => {
            setSocketUrl(SOCKET_URL + PATH)
        }
    });
    const RECEIVERS = Object.freeze({
        [MessageEnum.AUTH]: ({ status, user }) => {
            console.log(status, user)
            sendJsonMessage({
                code: MessageEnum.YEAR,
                year: new Date().getFullYear()
            })
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
                            {account.id}/{account.description}
                            <div>
                                <button>
                                    Act
                                </button>
                            </div>
                        </th>
                        {totals}
                    </tr>
                )
            }
            setTableAccounts(tAccounts)
        }
    })

    messageHistory.current = useMemo(() =>
        messageHistory.current.concat(lastMessage), [lastMessage]);

    const connectionStatus = {
        [ReadyState.CONNECTING]: 'Connecting',
        [ReadyState.OPEN]: 'Open',
        [ReadyState.CLOSING]: 'Closing',
        [ReadyState.CLOSED]: 'Closed',
        [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
    }[readyState];

    useEffect(() => {
        setSocketUrl(SOCKET_URL + PATH)
    }, [])
    return (
        <div>
            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>common.description</th>
                        {tableThead}
                    </tr>
                </thead>
                <tbody>
                    {tableAccounts}
                </tbody>
            </Table>
            <span>The WebSocket is currently {connectionStatus}</span>
        </div>
    );
};