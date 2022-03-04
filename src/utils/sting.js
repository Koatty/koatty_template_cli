/*
 * @Author: richen
 * @Date: 2020-12-08 10:46:49
 * @LastEditors: linyyyang<linyyyang@tencent.com>
 * @LastEditTime: 2020-12-08 10:46:57
 * @License: BSD (3-Clause)
 * @Copyright (c) - <richenlin(at)gmail.com>
 */
/**
 * underline or hyphens to camelCase name
 * @param {String} str input string
 * @returns {string} camelCase name
 */
exports.toCamelCase = (str) => {
    if (typeof str !== 'string') {
        return str;
    }
    return str
        .replace(/-(\w)/ig, ($0, $1) => $1.toUpperCase())
        .replace(/_(\w)/ig, ($0, $1) => $1.toUpperCase());
};

exports.toPascal = (str) => {
    if (typeof str !== 'string') {
        return str;
    }
    return this.toCamelCase(str).replace(/\w/i, $0 => $0.toUpperCase());
};

/**
 * camelCase to hyphens
 * @param {String} str input string
 * @returns {string} hyphens name
 */
exports.toHyphens = (str) => {
    if (typeof str !== 'string') {
        return str;
    }
    return str.replace(/[A-Z]/g, $0 => `-${$0.toLowerCase()}`);
};
