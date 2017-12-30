'use strict';

exports.getDataQuery = (botId, date1, date2, db) =>
    db
        .collection('apiai_responses').aggregate([
            {
                $match:
                    {
                        $and: [
                            { 'address.bot.id': botId },
                            { 'timestamp': { $gte: date1, $lte: date2 } }
                        ]
                    }
            },
            {
                $group: {
                    _id: { botid: '$address.bot.id' },
                    count: { $sum: 1 },
                    fallback: { $sum: { $cond: [{ $eq: ['Default Fallback Intent', '$result.metadata.intentName'] }, 1, 0] } }
                }
            },
            {
                $project: {
                    count: '$count',
                    fallback: '$fallback',
                    percent: { $divide: ['$fallback', '$count'] }
                }
            }
        ])
        .toArray()
    ;













