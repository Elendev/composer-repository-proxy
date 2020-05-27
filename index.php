<?php

use Composer\Factory;
use Composer\Repository\ComposerRepository;
use Composer\IO\NullIO;
use Composer\Config;

require_once "./vendor/autoload.php";

$repo = 'https://packages.drupal.org/8'; // 'https://packagist.org';

$repo = new ComposerRepository(['url' => $repo], new NullIO(), Factory::createConfig());

$providerNames = $repo->getProviderNames();

foreach ($providerNames as $providerName) {
    echo $providerName . "\n";
    $package = $repo->findPackage($providerName, '*');

}

$packageBuilder = new \Composer\Satis\Builder\PackagesBuilder();


echo 'There are ' . count($providerNames) . ' providers';