import NumberFormatOriginal from 'react-number-format';
export const NumberFormat = ({ value, t }) => {
    return (
        <NumberFormatOriginal className={value < 0 ? 'negative' : 'positive'} value={value} displayType={'text'} thousandSeparator={true} decimalScale={2} prefix={t('common.money_type')} />
    )
}