/* eslint-disable import/no-anonymous-default-export */
/* eslint-disable no-loop-func */
import "react-datepicker/dist/react-datepicker.css";
import AccountModal from "./WebSocketComponent/modals/AccountModal";
import AccountsTable from "./WebSocketComponent/AccountsTable";
import InvoicesModal from "./WebSocketComponent/modals/InvoicesModal";
import MessageReceiverEnum from "../enums/MessageReceiverEnum";
import React, { useState, useMemo, useRef, useEffect } from 'react';
import TransactionModal from "./WebSocketComponent/modals/TransactionModal";
import TransactionsModal from "./WebSocketComponent/modals/TransactionsModal";
import useWebSocket from 'react-use-websocket';
import YearTab from "./WebSocketComponent/YearTab";


const SOCKET_URL = 'ws://localhost:8765/'
const PATH = btoa('guilherme.fabrin@gmail.com:$2y$10$8SIHjbAwDS/Cy4fVWwoPf.FM19.KrHAPrUrdWOp8ZGQdwLD/7Bxc2')

let mainAccounts = []
let mainSendJsonMessage = null

const WebSocketComponent = ({ t, setters }) => {
    debugger
    const [socketUrl, setSocketUrl] = useState(SOCKET_URL + PATH);
    const messageHistory = useRef([]);

    const {
        sendJsonMessage,
        lastMessage,
        readyState,
    } = useWebSocket(socketUrl, {
        onOpen: () => {
            YearTab.change(new Date().getFullYear())
        },
        onMessage: (message) => {
            const json = JSON.parse(message.data)
            RECEIVERS[json.code](json)
        },
        shouldReconnect: (closeEvent) => true,
    });
    mainSendJsonMessage = sendJsonMessage
    const RECEIVERS = Object.freeze({
        [MessageReceiverEnum.USER]: ({ user }) => {
            setters.user(user)
        },
        [MessageReceiverEnum.ACCOUNTS]: ({ accounts }) => {
            mainAccounts = accounts
            AccountsTable.update(accounts)
        },
        [MessageReceiverEnum.YEAR]: ({ year }) => {
            YearTab.update(year)
            AccountsTable.loading()
        },
        [MessageReceiverEnum.NOTIFICATIONS]: (data) => {
            setters.notifications(data)
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
            YearTab.reload()
            TransactionsModal.reload()
        }
    })
    messageHistory.current = useMemo(() => {
        return messageHistory.current.concat(lastMessage)
    }, [lastMessage]);
    useEffect(() => {
        setSocketUrl(SOCKET_URL + PATH)
    }, [])
    setters.readyState(readyState)
    return (
        <div>
            <h2>
                {t('accounts.title')}
            </h2>
            <AccountModal.Elem t={t} accounts={mainAccounts} sendJsonMessage={sendJsonMessage} />
            <TransactionModal.Elem t={t} sendJsonMessage={sendJsonMessage} />
            <TransactionsModal.Elem t={t} sendJsonMessage={sendJsonMessage} />
            <InvoicesModal.Elem t={t} sendJsonMessage={sendJsonMessage} />
            <YearTab.Elem t={t} sendJsonMessage={sendJsonMessage} />
            <AccountsTable.Elem t={t} sendJsonMessage={sendJsonMessage} />
        </div>
    );
};

export default {
    Elem: WebSocketComponent,
    setCaptcha: (id, value) => {
        mainSendJsonMessage({
            code: MessageReceiverEnum.CAPTCHA,
            value,
            id
        });
    },
    setConfig: (id, value) => {
        mainSendJsonMessage({
            code: MessageReceiverEnum.CONFIG,
            value,
            id
        });
    },
    setSeen: (id) => {
        mainSendJsonMessage({
            code: MessageReceiverEnum.NOTIFICATION,
            id
        });
    }
}