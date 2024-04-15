const moment = require("moment");

const parseDate = async (rawDate) => {
  try {
    const contractDate = moment(rawDate, "DD.MM.YYYY").toDate();
    const strDate = contractDate.toISOString();

    return strDate;
  } catch (error) {
    const strDate = "";

    return strDate;
  }
};

const parseTSContracts = async (rawValue) => {
  let parsedDate = "";
  if (rawValue[14]) {
    parsedDate = await parseDate(rawValue[14]);
  }
  const ITN = rawValue[4].slice(0, 10);
  const parsedValue = {
    uniqueField: `${rawValue[0]} ${rawValue[1]} ${rawValue[2]} ${rawValue[3]} ${ITN} ${rawValue[10]}`,
    system: rawValue[0],
    project: rawValue[1],
    district: rawValue[2],
    orgName: rawValue[3],
    ITN: ITN,
    contractNumber: rawValue[10],
    commentary: rawValue[12],
    deadline: parsedDate,
    taskLink: rawValue[31],
  };

  return parsedValue;
};

module.exports = { parseTSContracts };
