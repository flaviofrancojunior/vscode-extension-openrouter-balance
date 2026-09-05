# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-09-05

### Added

- OpenRouter balance display in the status bar with the US dollar symbol.
- Color-coded indicator based on balance thresholds (normal/amber/red).
- Activity panel showing total spend, requests, token volume, and available balance.
- Secure management key storage via VS Code `SecretStorage`.
- Commands to set/clear the key, show activity, and refresh the balance.
- Configuration for refresh interval, color thresholds, and interface language.
- Unit test suite (mocha) for format, activity summary, and the OpenRouter client.
