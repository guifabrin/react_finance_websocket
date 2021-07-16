
/* eslint-disable react/no-direct-mutation-state */
/* eslint-disable import/no-anonymous-default-export */
import { Nav } from 'react-bootstrap';
import React from 'react';
import MessageReceiverEnum from '../../enums/MessageReceiverEnum';

let instance = null

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

class Elem extends React.Component {
    constructor(props) {
        super(props)
        const { sendJsonMessage } = this.props
        this.sendJsonMessage = sendJsonMessage
        this.state = {
            year: new Date().getFullYear(),
            list_year: [],
        };
        this.last = {}
        instance = this
    }


    change(year) {
        this.last.year = year
        this.update(year)
        this.sendJsonMessage({
            code: MessageReceiverEnum.YEAR,
            year
        });
    }

    reload() {
        this.change(this.last.year)
    }

    update(year) {
        this.state.year = year
        const years = getListYear(year)
        this.state.list_year = []
        for (const year of years) {
            this.state.list_year.push(
                <Nav.Item>
                    <Nav.Link eventKey={year} onSelect={() => this.change(year)}>{year}</Nav.Link>
                </Nav.Item>
            )
        }
        this.forceUpdate()
    }

    render() {
        return (
            <Nav variant="tabs" activeKey={this.state.year}>
                {this.state.list_year}
            </Nav>
        )
    }
}
export default {
    Elem,
    update: (year) => {
        instance.update(year)
    },
    change: (year) => {
        instance.change(year)
    },
    reload: () => {
        instance.reload()
    }
}