import Moment from 'moment';
export const DateFormat = ({ value, t }) => {
    return (
        <span> {Moment(value).format(t('formats.date'))} </span>
    )
}