const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const ldap = require('ldapjs');
const sql = require('mssql');
const db = require('../db/db');

router.post('/authenticate', function(req, res) {
    let client = ldap.createClient({ url: 'ldap://epsdc1.eps.local:389' });
    let user = req.body.user + '@eps.local';

    client.bind(user, req.body.password, error => {
        if (error) {
            res.status(401).json({
                title: 'Error',
                success: false,
                error: 'Sorry, the username/password entered is not valid.',
                msg: 'Invalid Login'
            });
        } else {
            db.then(conn => {
                let request = new sql.Request(conn);

                let query = `
                            SELECT DISTINCT
                                ua.personID
                            FROM
                                UserAccount ua
                                INNER JOIN UserGroupMember ugm ON ugm.userID = ua.userID
                                INNER JOIN UserGroup ug ON ug.groupID = ugm.groupID
                                AND ug.[name] = 'Student Information System'
                            WHERE
                                ua.username = '${req.body.user}'`;

                request.query(query).then(result => {
                    if (result.recordset.length == 0) {
                        res.status(403).json({
                            title: 'Forbidden or No Permission',
                            success: false,
                            error: 'Sorry, you do not have the required tool rights for this tool. Please contact an admin for help.',
                            msg: 'No Permission'
                        });
                    } else {
                        let token = jwt.sign(
                            { user: result.recordset[0] },
                            process.env.secret,
                            { expiresIn: 7200}
                        );

                        res.status(200).json({
                            title: 'Success',
                            success: true,
                            jwt: token
                        });
                    }
                }).catch(error => {
                    res.status(401).json({
                        title: 'Error',
                        success: false,
                        error: 'Sorry, unable to retrieve data from the database. Try again later.',
                        msg: process.env.environment === 'development' ? error : 'Database access error.'
                    });
                });
            }).catch(error => {
                res.status(401).json({
                    title: 'Error',
                    success: false,
                    error: 'Sorry, unable to connect to the database. Try again later.',
                    msg: process.env.environment === 'development' ? error : 'Database connection error.'
                });
            });
        }
    });
});

router.get('/', function (req, res) {
    res.status(404).json({
        title: '404',
        status: false,
        error: 'Route does not exist.'
    });
});

module.exports = router;
