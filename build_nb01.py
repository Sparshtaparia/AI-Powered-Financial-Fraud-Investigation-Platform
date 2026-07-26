import json
import os

notebook = {
 "cells": [
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "# 01 - Data Generation & Validation\n",
    "\n",
    "This notebook handles the end-to-end data pipeline for AegisAML:\n",
    "1. **Generation:** Clones and runs the IBM AMLSim simulator with a config up-weighting structuring typologies.\n",
    "2. **Injection:** Injects controlled, known ground-truth structuring rings to guarantee evaluation data for Notebook 06.\n",
    "3. **Validation:** Checks schema, referential integrity, and business logic."
   ]
  },
  {
   "cell_type": "code",
   "execution_count": None,
   "metadata": {},
   "outputs": [],
   "source": [
    "import pandas as pd\n",
    "import numpy as np\n",
    "import os\n",
    "import json\n",
    "import subprocess\n",
    "from pathlib import Path\n",
    "import random\n",
    "from datetime import datetime, timedelta\n",
    "\n",
    "# Set up data directories\n",
    "Path('../data/raw').mkdir(parents=True, exist_ok=True)\n",
    "Path('../data/processed').mkdir(parents=True, exist_ok=True)"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "## 1. AMLSim Setup & Execution\n",
    "We clone IBM AMLSim and configure it to boost structuring events."
   ]
  },
  {
   "cell_type": "code",
   "execution_count": None,
   "metadata": {},
   "outputs": [],
   "source": [
    "# Clone AMLSim\n",
    "if not os.path.exists('AMLSim'):\n",
    "    !git clone https://github.com/IBM/AMLSim.git\n",
    "\n",
    "# Instructions for the user (since it requires Java and Maven):\n",
    "# In the terminal, run:\n",
    "# cd AMLSim && ./build.sh\n",
    "\n",
    "print(\"AMLSim repository ready.\")"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": None,
   "metadata": {},
   "outputs": [],
   "source": [
    "# Helper function to patch the AMLSim parameter file to boost 'fan_in' and 'fan_out' structuring\n",
    "def patch_amlsim_config(config_path):\n",
    "    if not os.path.exists(config_path):\n",
    "        return\n",
    "    with open(config_path, 'r') as f:\n",
    "        config = json.load(f)\n",
    "    \n",
    "    # Upweight smurfing (fan_in/fan_out)\n",
    "    if 'alert_patterns' in config:\n",
    "        config['alert_patterns']['fan_in']['ratio'] = 0.4\n",
    "        config['alert_patterns']['fan_out']['ratio'] = 0.2\n",
    "    \n",
    "    with open(config_path, 'w') as f:\n",
    "        json.dump(config, f, indent=4)\n",
    "        \n",
    "# patch_amlsim_config('AMLSim/paramFiles/1K/param.json')\n",
    "# !cd AMLSim && ./run.sh conf/param.json"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "## 2. Synthetic Structuring Injector\n",
    "We explicitly inject controlled structuring rings. This provides a clean, known subset to evaluate the temporal graph model's recall against this specific typology."
   ]
  },
  {
   "cell_type": "code",
   "execution_count": None,
   "metadata": {},
   "outputs": [],
   "source": [
    "def inject_structuring_rings(tx_df, acct_df, num_rings=50, threshold=10000, days_spread=5, max_tx_size=3000):\n",
    "    \"\"\"\n",
    "    Injects structuring patterns: multiple smurf accounts transferring to a single target account \n",
    "    over a few days, where individual transactions are under `max_tx_size` but the total \n",
    "    approaches `threshold`.\n",
    "    \"\"\"\n",
    "    print(f\"Injecting {num_rings} controlled structuring rings...\")\n",
    "    \n",
    "    # Note: Implement actual injection logic here once the base dataset is loaded.\n",
    "    # 1. Sample target accounts.\n",
    "    # 2. Sample or create smurf accounts.\n",
    "    # 3. Generate transaction records with timestamps spread across `days_spread`.\n",
    "    # 4. Append to tx_df and label with is_sar=1 and typology='structuring_injected'.\n",
    "    \n",
    "    return tx_df, acct_df"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "## 3. Data Quality Validation\n",
    "Validating the schema, missing values, and business rules."
   ]
  },
  {
   "cell_type": "code",
   "execution_count": None,
   "metadata": {},
   "outputs": [],
   "source": [
    "def validate_dataset(tx_df, acct_df):\n",
    "    print(\"--- Data Quality Report ---\")\n",
    "    \n",
    "    # Missing Values\n",
    "    if tx_df is not None and not tx_df.empty:\n",
    "        print(\"\\nMissing Values in Transactions:\")\n",
    "        print(tx_df.isnull().sum())\n",
    "    \n",
    "    # Referential Integrity\n",
    "    if tx_df is not None and acct_df is not None:\n",
    "        sender_exists = tx_df['sender_id'].isin(acct_df['account_id']).all()\n",
    "        receiver_exists = tx_df['receiver_id'].isin(acct_df['account_id']).all()\n",
    "        print(f\"\\nAll senders exist in accounts: {sender_exists}\")\n",
    "        print(f\"All receivers exist in accounts: {receiver_exists}\")\n",
    "        \n",
    "        # Business Rules\n",
    "        negative_amts = (tx_df['amount'] <= 0).sum()\n",
    "        print(f\"\\nTransactions with <= 0 amount: {negative_amts}\")"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": None,
   "metadata": {},
   "outputs": [],
   "source": [
    "# Load, inject, validate, and save\n",
    "# tx_df = pd.read_csv('AMLSim/outputs/transactions.csv')\n",
    "# acct_df = pd.read_csv('AMLSim/outputs/accounts.csv')\n",
    "# tx_df, acct_df = inject_structuring_rings(tx_df, acct_df)\n",
    "# validate_dataset(tx_df, acct_df)\n",
    "# tx_df.to_parquet('../data/processed/transactions.parquet')\n",
    "# acct_df.to_parquet('../data/processed/accounts.parquet')"
   ]
  }
 ],
 "metadata": {
  "kernelspec": {
   "display_name": "Python 3",
   "language": "python",
   "name": "python3"
  },
  "language_info": {
   "name": "python",
   "version": "3.10"
  }
 },
 "nbformat": 4,
 "nbformat_minor": 4
}

with open('c:/Users/spars/Desktop/Societe Generale/notebooks/01_data_validation.ipynb', 'w', encoding='utf-8') as f:
    json.dump(notebook, f, indent=2)
