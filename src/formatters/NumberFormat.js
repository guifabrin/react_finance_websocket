import NumberFormatOriginal from "react-number-format";
import { t } from "../i18n";
export const NumberFormat = ({ value }) => {
  return (
    <NumberFormatOriginal
      className={value < 0 ? "negative" : "positive"}
      value={value}
      displayType={"text"}
      thousandSeparator={true}
      decimalScale={2}
      fixedDecimalScale={true}
      prefix={t("common.money_type")}
    />
  );
};
