<?php

use Composer\Factory;
use Composer\Repository\ComposerRepository;
use Composer\IO\NullIO;
use Composer\Config;

require_once "./vendor/autoload.php";

$output = Factory::createOutput();

$repo = 'https://packages.drupal.org/8'; // 'https://packagist.org';

$repo = new ComposerRepository(['url' => $repo], new NullIO(), Factory::createConfig());

$pool = new \Composer\DependencyResolver\Pool('dev');

$providerNames = $repo->getProviderNames();

$current = 0;
$packages = [];

foreach ($providerNames as $providerName) {
    echo $providerName . "\n";
    $currentPackages = $repo->whatProvides($pool, $providerName);

    if (!empty($currentPackages)) {
        $packages = array_merge($packages, $currentPackages);
        $current ++;
    } else {
        echo "Package $providerName not found\n";
    }

    if ($current > 1000) {
        break;
    }
}

$packageBuilder = new \Composer\Satis\Builder\PackagesBuilder($output, 'repos', [
    'name' => 'My repo',
    'providers' => true, // Generate a file per project
], false);

$packageBuilder->dump($packages);

echo 'There are ' . count($providerNames) . ' providers';