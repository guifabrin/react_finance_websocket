import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import { WebSocketComponent } from './components/WebSocketComponent';
import './i18n';
import { withNamespaces } from 'react-i18next';
import { Container, Row, Col, Navbar, Nav, NavDropdown } from 'react-bootstrap';
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBell, faGlobeAmericas } from '@fortawesome/free-solid-svg-icons'
import NumberFormat from 'react-number-format';
import { ReadyState } from 'react-use-websocket';

let fnCaptchaSender = () => { }
let lastReadyState = null

function App({ t }) {

  const [notificationsTransactions, setNotificationsTransactions] = useState('')
  const [notificationsInvoices, setNotificationsInvoices] = useState('')
  const [notificationsCaptcha, setNotificationsCaptcha] = useState('')
  const [notificationCount, setNotificationCount] = useState(0)
  const [stateConnection, setStateConnection] = useState('')
  const [user, setUser] = useState({})

  function confirmCaptcha(id) {
    const value = prompt('Who is this captcha?')
    if (value) {
      fnCaptchaSender(id, value)
    }
  }

  function setCaptchaConfirmation(sender) {
    fnCaptchaSender = sender
  }

  function setReadyState(readyState) {
    if (lastReadyState === readyState) {
      return
    }
    lastReadyState = readyState
    switch (readyState) {
      case ReadyState.CONNECTING:
        setStateConnection(<font className="text-warning"><FontAwesomeIcon icon={faGlobeAmericas} /></font>)
        break;
      case ReadyState.OPEN:
        setStateConnection(<font className="text-success"><FontAwesomeIcon icon={faGlobeAmericas} /></font>)
        break;
      default:
        setStateConnection(<font className="text-danger"><FontAwesomeIcon icon={faGlobeAmericas} /></font>)
        break;
    }
  }
  function setNotifications({ transactions, invoices, captchas }) {
    setNotificationCount(transactions.length + invoices.length + captchas.length)
    const lNotificationsTransactions = []
    for (const { transaction } of transactions) {
      lNotificationsTransactions.push(
        <NavDropdown.Item key={`notification_transaction_${transaction.id}`}>
          {t('common.imported')} {transaction.description}
          <small> <NumberFormat value={transaction.value} displayType={'text'} thousandSeparator={true} decimalScale={2} /></small>
        </NavDropdown.Item>
      )
    }
    setNotificationsTransactions(lNotificationsTransactions)
    //
    const lNotificationsInvoices = []
    for (const { invoice } of invoices) {
      lNotificationsInvoices.push(
        <NavDropdown.Item key={`notification_invoice_${invoice.id}`}>
          {t('common.imported')}  {invoice.description}
          <small> <NumberFormat value={invoice.total} displayType={'text'} thousandSeparator={true} decimalScale={2} /></small>
        </NavDropdown.Item>
      )
    }
    setNotificationsInvoices(lNotificationsInvoices)

    const lNotificationsCaptchas = []
    for (const captcha of captchas) {
      lNotificationsCaptchas.push(
        <NavDropdown.Item className="captcha" key={`notification_captcha_${captcha.id}`} >
          <img src={captcha.base64_url} alt={captcha.id} onClick={() => { confirmCaptcha(captcha.id) }} />
        </NavDropdown.Item>
      )
    }
    setNotificationsCaptcha(lNotificationsCaptchas)
  }
  return (
    <div className="App">
      <Navbar bg="light" expand="lg">
        <Container fluid>
          <Navbar.Brand href="#home">React-Bootstrap</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="justify-content-end" style={{ width: "100%" }}>
              <Nav.Link href="#state">{stateConnection}</Nav.Link>
              <div className="notifications">
                <small className="count">{notificationCount}</small>
                <NavDropdown alignRight title={<FontAwesomeIcon icon={faBell} />} id="notifications">
                  {notificationsTransactions}
                  {notificationsInvoices ? <NavDropdown.Divider /> : ''}
                  {notificationsInvoices}
                  {notificationsCaptcha ? <NavDropdown.Divider /> : ''}
                  {notificationsCaptcha}
                </NavDropdown>
              </div>
              <NavDropdown alignRight title={user.name} id="user">

              </NavDropdown>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <Container fluid>
        <Row>
          <Col xs={2} lg={2}>
          </Col>
          <Col xs={10} lg={10}>
            <WebSocketComponent t={t} setNotifications={setNotifications} setCaptchaConfirmation={setCaptchaConfirmation} setUser={setUser} setReadyState={setReadyState} />
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default withNamespaces()(App);
