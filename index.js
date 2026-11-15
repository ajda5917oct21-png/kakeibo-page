"use strict";

const STORAGE_KEY = "kakeiboEntries";
const yenFormatter = new Intl.NumberFormat("ja-JP");

const form = document.querySelector("form");
const dateInput = document.querySelector("#entry-date");
const itemInput = document.querySelector("#entry-item");
const typeInput = document.querySelector("#entry-type");
const amountInput = document.querySelector("#entry-amount");
const entryList = document.querySelector("#entry-list");
const incomeTotal = document.querySelector("#income-total");
const expenseTotal = document.querySelector("#expense-total");
const balanceTotal = document.querySelector("#balance-total");

function isEntry(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof value.date === "string" &&
    typeof value.item === "string" &&
    (value.type === "income" || value.type === "expense") &&
    Number.isSafeInteger(value.amount) &&
    value.amount > 0
  );
}

function readEntries() {
  const savedData = localStorage.getItem(STORAGE_KEY);
  if (savedData === null) {
    return [];
  }

  let parsedData;
  try {
    parsedData = JSON.parse(savedData);
  } catch {
    throw new Error("保存データを読み込めません。データ形式が正しくありません。");
  }

  if (!Array.isArray(parsedData) || !parsedData.every(isEntry)) {
    throw new Error("保存データの形式が正しくありません。");
  }

  return parsedData;
}

function renderEntries(entries) {
  entryList.replaceChildren();

  if (entries.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 4;
    cell.textContent = "登録データはありません。";
    row.append(cell);
    entryList.append(row);
    return;
  }

  for (const entry of entries) {
    const row = document.createElement("tr");
    const values = [
      entry.date,
      entry.item,
      entry.type === "income" ? "収入" : "支出",
      yenFormatter.format(entry.amount),
    ];

    for (const value of values) {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.append(cell);
    }

    entryList.append(row);
  }
}

function renderTotals(entries) {
  const income = entries
    .filter((entry) => entry.type === "income")
    .reduce((total, entry) => total + entry.amount, 0);
  const expense = entries
    .filter((entry) => entry.type === "expense")
    .reduce((total, entry) => total + entry.amount, 0);

  incomeTotal.textContent = yenFormatter.format(income);
  expenseTotal.textContent = yenFormatter.format(expense);
  balanceTotal.textContent = yenFormatter.format(income - expense);
}

function render(entries) {
  renderEntries(entries);
  renderTotals(entries);
}

let entries;
let isReady = false;

try {
  entries = readEntries();
  render(entries);
  isReady = true;
} catch (error) {
  form.querySelectorAll("input, select, button").forEach((control) => {
    control.disabled = true;
  });
  window.alert(error.message);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!isReady) {
    return;
  }

  const amount = Number(amountInput.value);
  const item = itemInput.value.trim();
  if (!form.reportValidity() || item.length === 0 || !Number.isSafeInteger(amount)) {
    window.alert("品目を入力し、金額には1以上の整数を入力してください。");
    return;
  }

  const entry = {
    date: dateInput.value,
    item,
    type: typeInput.value,
    amount,
  };
  const updatedEntries = [...entries, entry];

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEntries));
  } catch (error) {
    window.alert(`データを保存できませんでした: ${error.message}`);
    return;
  }

  entries = updatedEntries;
  render(entries);
  form.reset();
});
