-- Create a revlooper_test DB for CI and local test runs
SELECT 'CREATE DATABASE revlooper_test'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'revlooper_test')\gexec
