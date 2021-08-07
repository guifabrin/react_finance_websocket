import "./App.scss";
import "./i18n";
import {
  Container,
  Row,
  Col,
  Navbar,
  Nav,
  NavDropdown,
  Badge,
} from "react-bootstrap";
import {
  faBell,
  faGlobeAmericas,
  faCompactDisc,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { NumberFormat } from "./formatters/NumberFormat";
import { ReadyState } from "react-use-websocket";
import { useState } from "react";
import { withTranslation } from "react-i18next";
import logo from "./assets/images/icon.png";
import WebSocketComponent from "./components/WebSocketComponent";

let lastReadyState = null;

const themes = [
  "cerulean",
  "cosmo",
  "cyborg",
  "darkly",
  "flatly",
  "journal",
  "litera",
  "lumen",
  "lux",
  "materia",
  "minty",
  "morph",
  "pulse",
  "quartz",
  "sandstone",
  "simplex",
  "sketchy",
  "slate",
  "solar",
  "spacelab",
  "superhero",
  "united",
  "vapor",
  "yeti",
  "zephyr",
];

function App({ t }) {
  const [notificationsTransactions, setNotificationsTransactions] =
    useState("");
  const [notificationsInvoices, setNotificationsInvoices] = useState("");
  const [notificationsCaptcha, setNotificationsCaptcha] = useState("");
  const [notificationCount, setNotificationCount] = useState(0);
  const [stateConnection, setStateConnection] = useState("");
  const [user, setUserMain] = useState({});
  const [compactMode, setCompactMode] = useState(1);
  const [fontSize, setFontSize] = useState(1);
  const [theme, setTheme] = useState("united");

  function confirmCaptcha(id) {
    const value = prompt("Who is this captcha?");
    if (value) {
      WebSocketComponent.setCaptcha(id, value);
    }
  }
  function setSeen(notification) {
    WebSocketComponent.setSeen(notification.id);
  }
  function toogleCompactMode() {
    const newCompactMode = compactMode ? 0 : 1;
    WebSocketComponent.setConfig(4, newCompactMode);
    setCompactMode(newCompactMode);
  }
  function toogleFontSize(value) {
    const newFontSize = fontSize * value;
    WebSocketComponent.setConfig(3, newFontSize);
    setFontSize(newFontSize);
  }
  function toogleTheme(value) {
    WebSocketComponent.setConfig(2, value);
    setTheme(value);
  }

  const setters = {
    user: (main_user) => {
      setUserMain(main_user);
      setCompactMode(getConfig(4, 0, main_user));
      setFontSize(getConfig(3, 1, main_user));
      setTheme(getConfig(2, "united", main_user));
    },
    readyState: (readyState) => {
      if (lastReadyState === readyState) {
        return;
      }
      lastReadyState = readyState;
      switch (readyState) {
        case ReadyState.CONNECTING:
          setStateConnection(
            <font className="text-warning">
              <FontAwesomeIcon icon={faGlobeAmericas} />
            </font>
          );
          break;
        case ReadyState.OPEN:
          setStateConnection(
            <font className="text-success">
              <FontAwesomeIcon icon={faGlobeAmericas} />
            </font>
          );
          break;
        default:
          setStateConnection(
            <font className="text-danger">
              <FontAwesomeIcon icon={faGlobeAmericas} />
            </font>
          );
          break;
      }
    },
    notifications: ({ transactions, invoices, captchas }) => {
      setNotificationCount(
        transactions.length + invoices.length + captchas.length
      );
      const lNotificationsTransactions = [];
      for (const { notification, transaction } of transactions) {
        lNotificationsTransactions.push(
          <NavDropdown.Item
            key={`notification_transaction_${transaction.id}`}
            onClick={() => setSeen(notification)}
          >
            {t("common.imported")} {transaction.description}
            <small>
              {" "}
              <NumberFormat t={t} value={transaction.value} />
            </small>
          </NavDropdown.Item>
        );
      }
      setNotificationsTransactions(lNotificationsTransactions);

      const lNotificationsInvoices = [];
      for (const { notification, invoice } of invoices) {
        lNotificationsInvoices.push(
          <NavDropdown.Item
            key={`notification_invoice_${invoice.id}`}
            onClick={() => setSeen(notification)}
          >
            {t("common.imported")} {invoice.description}
            <small>
              {" "}
              <NumberFormat t={t} value={invoice.total} />
            </small>
          </NavDropdown.Item>
        );
      }
      setNotificationsInvoices(lNotificationsInvoices);
      const lNotificationsCaptchas = [];
      for (const captcha of captchas) {
        lNotificationsCaptchas.push(
          <NavDropdown.Item
            className="captcha"
            key={`notification_captcha_${captcha.id}`}
          >
            <img
              src={captcha.base64_url}
              alt={captcha.id}
              onClick={() => {
                confirmCaptcha(captcha.id);
              }}
            />
          </NavDropdown.Item>
        );
      }
      setNotificationsCaptcha(lNotificationsCaptchas);
    },
  };

  function getConfig(id, defaultt, main_user = user) {
    let value = defaultt;
    const valueConfig = main_user.configs
      ? main_user.configs.filter(({ config }) => config.id === id)[0]
      : null;
    if (valueConfig) {
      value = valueConfig.value;
    }
    return value;
  }

  const lThemes = [];
  for (const themee of themes) {
    lThemes.push(
      <NavDropdown.Item
        key={`theme_${themee}`}
        onClick={() => toogleTheme(themee)}
      >
        {themee}
      </NavDropdown.Item>
    );
  }
  return (
    <div className="App">
      <link
        rel="stylesheet"
        href={`https://cdn.jsdelivr.net/npm/bootswatch@5.0.1/dist/${theme}/bootstrap.min.css`}
      ></link>
      <style>{`\
        html{\
          font-size: ${fontSize * 12}px !important;\
        }\
        ${compactMode ? ".hide-compact {display: none;}" : ""}
      `}</style>
      <Navbar bg="light" expand="lg">
        <Container fluid>
          <Navbar.Brand href="#home">
            <img src={logo} className="logo" alt="" />
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="justify-content-end" style={{ width: "100%" }}>
              <Nav.Link href="#compact" onClick={() => toogleCompactMode()}>
                {compactMode ? (
                  <font className="text-success">
                    <FontAwesomeIcon icon={faCompactDisc} />
                  </font>
                ) : (
                  <font>
                    <FontAwesomeIcon icon={faCompactDisc} />
                  </font>
                )}
              </Nav.Link>
              <Nav.Link href="#compact" onClick={() => toogleFontSize(0.9)}>
                {fontSize < 1 ? (
                  <Badge pill className="bg-success">
                    A-
                  </Badge>
                ) : (
                  <Badge pill className="bg-secondary">
                    A-
                  </Badge>
                )}
              </Nav.Link>
              <Nav.Link href="#compact" onClick={() => toogleFontSize(1.1)}>
                {fontSize > 1 ? (
                  <Badge pill className="bg-success">
                    A+
                  </Badge>
                ) : (
                  <Badge pill className="bg-secondary">
                    A+
                  </Badge>
                )}
              </Nav.Link>
              <NavDropdown alignRight title={theme} id="themes">
                {lThemes}
              </NavDropdown>
              <Nav.Link href="#state">{stateConnection}</Nav.Link>
              <div className="notifications">
                <small className="count">{notificationCount}</small>
                <NavDropdown
                  alignRight
                  title={<FontAwesomeIcon icon={faBell} />}
                  id="notifications"
                >
                  {notificationsTransactions}
                  {notificationsInvoices ? <NavDropdown.Divider /> : ""}
                  {notificationsInvoices}
                  {notificationsCaptcha ? <NavDropdown.Divider /> : ""}
                  {notificationsCaptcha}
                </NavDropdown>
              </div>
              <NavDropdown alignRight title={user.name} id="user"></NavDropdown>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <Container fluid>
        <Row>
          <Col xs={12} lg={12}>
            <WebSocketComponent.Elem t={t} setters={setters} />
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default withTranslation()(App);
