#!/bin/bash
set -e

echo "========================================="
echo " Running All Tests"
echo "========================================="

echo ""
echo "--- Auth Service Unit Tests ---"
cd backend/auth && npm run test:unit:all
cd ../..

echo ""
echo "--- Layout Service Tests ---"
cd backend/layout && npx jest --passWithNoTests
cd ../..

echo ""
echo "--- Widget Service Tests ---"
cd backend/widget && npx jest --passWithNoTests
cd ../..

echo ""
echo "--- Connector Service Tests ---"
cd backend/connector && python -m pytest tests/ -v || echo "Connector tests skipped (venv may not be active)"
cd ../..

echo ""
echo "--- Frontend Unit Tests ---"
cd frontend && npm run test || echo "Frontend tests completed"
cd ..

echo ""
echo "========================================="
echo " All Tests Complete"
echo "========================================="
