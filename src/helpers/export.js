import { saveAs } from 'file-saver';
import { writeFileXLSX, utils as xlsxUtils } from "xlsx";

const processRow = function (row, sep) {
  var finalVal = '';

  for (var j = 0; j < row.length; j++) {

    var innerValue = row[j] === null ? '' : row[j].toString();

    if (row[j] instanceof Date) {
      innerValue = row[j].toLocaleString();
    }

    var result = innerValue.replace(/"/g, '""');

    if (result.search(/("|,|\n)/g) >= 0) {
      result = '"' + result + '"';
    }

    if (j > 0) {
      finalVal += (sep) ? sep : '\t';
    }
    finalVal += result;
  }
  return finalVal + '\n';
};

const s2ab = function (s) {
  var buf = new ArrayBuffer(s.length);
  var view = new Uint8Array(buf);
  for (var i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
  return buf;
}

const json2xml = function (o, tab) {
  var toXml = function (v, name, ind) {
    var xml = "";
    if (v instanceof Array) {
      for (var i = 0, n = v.length; i < n; i++) {
        xml += ind + toXml(v[i], name, ind + "\t") + "\n";
      }
    } else if (typeof (v) == "object") {
      var hasChild = false;
      xml += ind + "<row-" + name;

      for (let m in v) {
        if (m.charAt(0) == "@") {
          xml += " " + m.substr(1) + "=\"" + v[m].toString() + "\"";
        } else {
          hasChild = true;
        }
      }

      xml += hasChild ? ">" : "/>";

      if (hasChild) {
        for (let m in v) {
          if (m == "#text") {
            xml += v[m];
          } else if (m == "#cdata") {
            xml += "<![CDATA[" + v[m] + "]]>";
          } else if (m.charAt(0) != "@") {
            xml += toXml(v[m], m, ind + "\t");
          }
        }
        xml += (xml.charAt(xml.length - 1) == "\n" ? ind : "") + "</row-" + name + ">";
      }
    } else {
      xml += ind + "<" + name + ">" + v.toString() + "</" + name + ">";
    }
    return xml;
  }, xml = '<?xml version="1.0" encoding="UTF-8"?><tabledata>';

  for (var m in o) {
    xml += toXml(o[m], m, "");
  }

  return tab ? xml.replace(/\t/g, tab) + "</tabledata>" : xml.replace(/\t|\n/g, "") + "</tabledata>";
}


const exportCSVFromJS = (filename, rows, sep) => {
  let csvFile = '';
  for (let i = 0; i < rows.length; i++) {
    csvFile += processRow(rows[i], sep);
  }

  let blob = new Blob([csvFile], { type: 'text/csv;charset=utf-8;' });

  if (navigator.msSaveBlob) { // IE 10+
    navigator.msSaveBlob(blob, `${filename}.csv`);
  } else {
    let link = document.createElement("a");
    if (link.download !== undefined) { // feature detection
      // Browsers that support HTML5 download attribute
      let url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${filename}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}


const exportXLSFromJS = (filename, rows, sheetName = "Sheet 1") => {
  var wb = xlsxUtils.book_new();
  wb.Props = {
    Title: filename,
    Author: "Noname",
  };
  wb.SheetNames.push(sheetName);
  var ws = xlsxUtils.aoa_to_sheet(rows);
  wb.Sheets[sheetName] = ws;
  var wbout = writeFileXLSX(wb, { bookType: 'xlsx', type: 'binary' });
  saveAs(new Blob([s2ab(wbout)], { type: "application/octet-stream" }), `${filename}.xlsx`);
}

const exportJSONFromJS = (filename, rows) => {
  rows = JSON.stringify(rows);
  let blob = new Blob([rows], { type: "application/json" });
  window.saveAs(blob, `${filename}.json`);
}

const exportXMLFromJS = (filename, jsonObj) => {
  let xml = json2xml(jsonObj);
  var blob = new Blob([xml], { type: "text/xml" });
  window.saveAs(blob, `${filename}.xml`);
}

const saveDataFromJS = (filename, exportdata, filetype = 'csv') => {
  filetype = filetype ? filetype : "csv";

  switch (filetype) {
    case 'csv': exportCSVFromJS(filename, exportdata); break;
    case 'ms-excel': exportXLSFromJS(filename, exportdata); break;
    case 'json': exportJSONFromJS(filename, exportdata); break;
    case 'xml': exportXMLFromJS(filename, exportdata); break;
  }
}



export { saveDataFromJS };