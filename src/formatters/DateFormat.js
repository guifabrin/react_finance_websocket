import Moment from "moment";
import { t } from "../i18n";
export const DateFormat = ({ value }) => {
  return <span> {Moment(value).format(t("formats.date"))} </span>;
};
