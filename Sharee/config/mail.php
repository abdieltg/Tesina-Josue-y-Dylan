<?php

return [
    'username' => getenv('SHAREE_MAIL_USERNAME') ?: '',
    'password' => getenv('SHAREE_MAIL_PASSWORD') ?: '',
    'from' => getenv('SHAREE_MAIL_FROM') ?: (getenv('SHAREE_MAIL_USERNAME') ?: ''),
];