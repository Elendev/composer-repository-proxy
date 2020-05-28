<?php

use Composer\Factory;
use Composer\IO\ConsoleIO;
use Composer\Repository\ComposerRepository;
use Composer\Satis\Builder\PackagesBuilder;
use Symfony\Component\Console\Helper\HelperSet;
use Symfony\Component\Console\Input\ArgvInput;
use Symfony\Component\Filesystem\Filesystem;

require_once "./vendor/autoload.php";

$outputDirectory = __DIR__ . '/repository';

$output = Factory::createOutput();

$io = new ConsoleIO(new ArgvInput(), $output, new HelperSet([]));

$repo = 'https://packages.drupal.org/8'; // 'https://packagist.org';

$repo = new ComposerRepository(['url' => $repo], $io, Factory::createConfig());

$pool = new \Composer\DependencyResolver\Pool('dev');

$providerNames = $repo->getProviderNames();


$packageBuilder = new PackagesBuilder($output, $outputDirectory, [
  'name' => 'My repo',
  'providers' => true, // Generate a file per project
], false);

$packages = [];
$counter = 1;

foreach ($providerNames as $providerName) {
    try {
        $output->write($counter . "/" . count($providerNames) . " - " . $providerName . "\n");
        $currentPackages = $repo->whatProvides($pool, $providerName);

        if (!empty($currentPackages)) {
            $packages = array_merge($packages, $currentPackages);
        } else {
            $output->write("Package $providerName not found\n");
        }
    } catch (\Exception $e) {
        $output->writeln('An error occured for provider ' . $providerName . ':' . $e->getMessage());
    }


    $counter ++;
}

$packageBuilder->dump($packages);

$fs = new Filesystem();

// Because of the way JFrog works, we have to copy every 'short' JSON into the '/p' directory
$output->write("Copy package files");
$fs->mirror($outputDirectory . '/p2', $outputDirectory . '/p');


