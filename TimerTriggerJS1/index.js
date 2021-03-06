'use strict';

const moment = require('moment-timezone');
const format = require('string-format');
require('dotenv').config();

const mongoClient = require('./libs/mongodb');
const mongoUtil = require('./libs/mongoutils');

module.exports = function (context, myTimer) {

    if (myTimer.isPastDue) {
        context.log('JavaScript is running late!');
    }

    processResponses(context);
};

function processResponses(context) {
    mongoClient.processQuery(
        mongoUtil.getDataQuery.bind(null, process.env.BOT_ID, moment().subtract(1, 'hour').format(), moment().format()),
        ([data]) => notification(data ? Object.assign(data, { context: context }) : { context: context })
    );
}

function notification({ count = 0, fallback = 0, percent = 0.0, context = null }) {
    if (percent * 100 >= process.env.THRESHOLD) {
        const mailBody = format(
            process.env.MAIL_TEMPLATE,
            `${moment().subtract(1, 'hour').tz(process.env.TZ).format('HH:mm')}-${moment().tz(process.env.TZ).format('HH:mm')}`,//Interval.
            process.env.BOT_ID,//Bot Id.
            `${process.env.THRESHOLD}%`,//Threshold.
            count,//Quantities.
            fallback,//Fallbacks.
            `${percent * 100}%`);//Percent.

        const send = require('gmail-send')({
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASSWORD,
            to: process.env.MAIL_DESTINATION.split(/[ ,;]/).filter(s => s),
            subject: 'Reporte',
            html: mailBody,
        });

        send({}, (err, res) => context.log(`error: ${err}, response: ${res} percent: ${percent} time: ${moment().tz(process.env.TZ).format(process.env.FORMAT)}`));
    } else {
        context.log(`percent: ${percent} time: ${moment().tz(process.env.TZ).format(process.env.FORMAT)}`);
    }

    context.done();
}
