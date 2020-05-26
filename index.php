<?php

use Composer\Repository\ComposerRepository;
use Composer\IO\NullIO;
use Composer\Config;

require_once "./vendor/autoload.php";

$repo = new ComposerRepository(['url' => 'https://packagist.org'], new NullIO(), new Config(true, '.composer'));

$packages = $repo->getPackages();

print_r($packages);