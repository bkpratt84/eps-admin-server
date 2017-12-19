const express = require('express');
const router = express.Router();

router.get('*', function (req, res) {
    res.status(404).json({
        title: '404',
        status: false,
        error: 'Route does not exist.'
    });
});

module.exports = router;