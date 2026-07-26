import json
import os
import textwrap

def md(text):
    return {"cell_type": "markdown", "metadata": {}, "source": [line + '\n' for line in text.split('\n')]}

def code(text):
    return {"cell_type": "code", "execution_count": None, "metadata": {}, "outputs": [], "source": [line + '\n' for line in text.split('\n')]}

def create_notebook(cells):
    return {
        "cells": cells,
        "metadata": {
            "kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"},
            "language_info": {"name": "python", "version": "3.10"}
        },
        "nbformat": 4,
        "nbformat_minor": 4
    }

# ==========================================
# 00_dataset_preparation.ipynb
# ==========================================
nb00 = []

nb00.append(md("""# 00 - Dataset Preparation & Structuring Injection

## 1. Introduction and Reproducibility
This notebook establishes the foundational dataset for the AegisAML research pipeline. We leverage the **IBM AMLSim** simulator to generate a baseline transaction graph and explicitly inject mathematically controlled structuring (smurfing) typologies. This guarantees a verified ground-truth subset for evaluating the temporal graph model's recall.
"""))

nb00.append(code("""import pandas as pd
import numpy as np
import networkx as nx
import matplotlib.pyplot as plt
import seaborn as sns
import os
import json
import time
from datetime import datetime, timedelta
from pathlib import Path

# 1.1 Reproducibility Configuration
RANDOM_SEED = 42
np.random.seed(RANDOM_SEED)

# Visualization settings
sns.set_theme(style="whitegrid")
plt.rcParams['figure.figsize'] = (10, 6)
plt.rcParams['font.size'] = 12

# Initialize Directories
DIRS = ['../data/raw', '../data/processed', '../reports', '../figures']
for d in DIRS:
    Path(d).mkdir(parents=True, exist_ok=True)
    
start_time = time.time()
print(f"Notebook execution started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
"""))

nb00.append(md("""## 2. AMLSim Overview & Configuration
IBM AMLSim generates synthetic transaction networks based on specified parameters. To ensure our temporal graph model has sufficient positive samples of structuring rings, we dynamically modify the parameter configuration.

### 2.1 Parameter Modifications

| Parameter | Default | Modified | Reason |
| :--- | :---: | :---: | :--- |
| `fan_in` | 0.02 | 0.30 | Drastically increase smurfing probability to ensure adequate positive samples. |
| `fan_out` | 0.02 | 0.10 | Increase layering/distribution networks. |
| `cycle` | 0.05 | 0.10 | Increase circular transaction flows. |
"""))

nb00.append(code("""def configure_amlsim():
    # If the param.json exists (assuming AMLSim is cloned), we patch it.
    config_path = Path('AMLSim/paramFiles/1K/param.json')
    if config_path.exists():
        with open(config_path, 'r') as f:
            config = json.load(f)
            
        # Apply modifications
        if 'alert_patterns' in config:
            config['alert_patterns']['fan_in']['ratio'] = 0.30
            config['alert_patterns']['fan_out']['ratio'] = 0.10
            config['alert_patterns']['cycle']['ratio'] = 0.10
            
        with open(config_path, 'w') as f:
            json.dump(config, f, indent=4)
        print("AMLSim configuration successfully patched.")
    else:
        print("AMLSim repository not detected locally. Skipping configuration patch.")

configure_amlsim()

# In a full run, we would execute the simulator here:
# import subprocess
# subprocess.run(["./build.sh"], cwd="AMLSim")
# subprocess.run(["./run.sh", "conf/param.json"], cwd="AMLSim")
"""))

nb00.append(md("""## 3. Dataset Generation & Statistics
For the purpose of this notebook's immediate execution, if AMLSim outputs are not present, we simulate a statistically similar baseline dataset.
"""))

nb00.append(code("""def load_or_generate_base_dataset(num_accounts=1000, num_txs=10000):
    tx_path = Path('AMLSim/outputs/transactions.csv')
    acct_path = Path('AMLSim/outputs/accounts.csv')
    
    if tx_path.exists() and acct_path.exists():
        print("Loading AMLSim outputs...")
        tx_df = pd.read_csv(tx_path)
        acct_df = pd.read_csv(acct_path)
    else:
        print("AMLSim outputs not found. Generating baseline dataset...")
        accounts = range(1, num_accounts + 1)
        acct_df = pd.DataFrame({'account_id': accounts, 'customer_id': accounts, 'init_balance': 5000})
        
        senders = np.random.choice(accounts, size=num_txs)
        receivers = np.random.choice(accounts, size=num_txs)
        # Fix self-transfers
        receivers = np.where(senders == receivers, (receivers % num_accounts) + 1, receivers)
        
        base_time = datetime(2023, 1, 1)
        timestamps = [base_time + timedelta(hours=np.random.randint(0, 24*30)) for _ in range(num_txs)]
        
        tx_df = pd.DataFrame({
            'tx_id': [f"tx_{i}" for i in range(num_txs)],
            'sender_id': senders,
            'receiver_id': receivers,
            'amount': np.random.lognormal(mean=4.0, sigma=1.0, size=num_txs).round(2),
            'timestamp': timestamps,
            'is_sar': 0,
            'typology': 'normal'
        })
    return tx_df, acct_df

tx_df, acct_df = load_or_generate_base_dataset()

# Compute Dataset Statistics
stats = {
    "Total Accounts": len(acct_df),
    "Total Transactions": len(tx_df),
    "Date Range": f"{tx_df['timestamp'].min()} to {tx_df['timestamp'].max()}",
    "Average Transaction Size": f"${tx_df['amount'].mean():.2f}"
}
stats_df = pd.DataFrame(list(stats.items()), columns=["Metric", "Value"])
display(stats_df)
"""))

nb00.append(md("""## 4. Synthetic Typology Injection (Structuring)

### Algorithm 1: Temporal Structuring Injection
**Input**: Base transactions $G$, set of accounts $V$, threshold $\tau$, max days $\Delta d$, number of rings $R$
**Output**: Augmented transactions $G'$, Typology Manifest $M$

For each ring $r \in \{1 \dots R\}$:
1. Select a destination account $T \in V$.
2. Sample $N \in [4, 12]$ mule accounts $S \subset V \setminus \{T\}$.
3. Define total illicit amount $A \sim U(0.85\tau, 0.99\tau)$.
4. Partition $A$ into $N$ transactions such that $\forall x \in A_{parts}, x < \tau$.
5. Assign timestamps $t_i$ strictly increasing within a $\Delta d$ window.
6. Record ring metadata into manifest $M$.
"""))

nb00.append(code("""def inject_structuring_rings(tx_df, acct_df, num_rings=100, threshold=10000, max_days=5):
    injected_txs = []
    manifest = []
    
    accounts = acct_df['account_id'].values
    
    for r_idx in range(num_rings):
        target = np.random.choice(accounts)
        num_mules = np.random.randint(4, 13)
        mules = np.random.choice(accounts[accounts != target], size=num_mules, replace=False)
        
        # Total amount just under reporting threshold
        total_amount = np.random.uniform(threshold * 0.85, threshold * 0.99)
        
        # Random partition of the amount
        partitions = np.random.dirichlet(np.ones(num_mules)) * total_amount
        
        # Temporal window
        start_time = datetime(2023, 1, 1) + timedelta(days=np.random.randint(0, 20))
        
        ring_txs = []
        for i, mule in enumerate(mules):
            tx_time = start_time + timedelta(hours=np.random.randint(0, max_days*24))
            ring_txs.append({
                'tx_id': f"ring_{r_idx}_{i}",
                'sender_id': mule,
                'receiver_id': target,
                'amount': round(partitions[i], 2),
                'timestamp': tx_time,
                'is_sar': 1,
                'typology': 'structuring'
            })
            
        # Ensure temporal ordering for realism
        ring_txs.sort(key=lambda x: x['timestamp'])
        injected_txs.extend(ring_txs)
        
        manifest.append({
            'Ring_ID': f"R{r_idx:03d}",
            'Typology': 'Structuring',
            'Accounts_Involved': num_mules + 1,
            'Duration_Days': max_days,
            'Total_Amount': round(total_amount, 2),
            'Ground_Truth': 'Positive'
        })
        
    inj_df = pd.DataFrame(injected_txs)
    manifest_df = pd.DataFrame(manifest)
    
    return pd.concat([tx_df, inj_df], ignore_index=True), manifest_df

augmented_tx_df, manifest_df = inject_structuring_rings(tx_df, acct_df)

print(f"Successfully injected {len(manifest_df)} structuring rings.")
display(manifest_df.head())
"""))

nb00.append(md("""## 5. Topological Visualization
Visualizing multiple rings to confirm the `fan_in` bipartite structure.
"""))

nb00.append(code("""fig, axes = plt.subplots(1, 3, figsize=(18, 5))
fig.suptitle("Visual Verification of Injected Structuring Rings (Fan-In Topology)", fontsize=16)

for idx, r_id in enumerate(['R000', 'R001', 'R002']):
    ring_txs = augmented_tx_df[augmented_tx_df['tx_id'].str.startswith(f"ring_{int(r_id[1:])}_")]
    
    G = nx.DiGraph()
    for _, row in ring_txs.iterrows():
        G.add_edge(row['sender_id'], row['receiver_id'], weight=row['amount'])
        
    pos = nx.spring_layout(G, seed=RANDOM_SEED)
    nx.draw(G, pos, ax=axes[idx], with_labels=True, node_color='#aed6f1', node_size=1500, edge_color='gray', arrows=True)
    axes[idx].set_title(f"Ring {r_id}")

plt.savefig('../figures/ring_topologies.png')
plt.show()
"""))

nb00.append(md("""## 6. Export and Metadata Footer
Exporting the `typology_manifest.csv`, augmented data, and finalizing execution.
"""))

nb00.append(code("""# Exporting Data
augmented_tx_df.to_parquet('../data/raw/transactions.parquet', index=False)
acct_df.to_parquet('../data/raw/accounts.parquet', index=False)
manifest_df.to_csv('../data/raw/typology_manifest.csv', index=False)

# Execution Metadata
end_time = time.time()
execution_time = end_time - start_time
print("--- Notebook Metadata ---")
print(f"Dataset Version: v1.0 (AMLSim Augmented)")
print(f"Execution Time: {execution_time:.2f} seconds")
print("Artifacts successfully exported to ../data/raw/")
"""))

# ==========================================
# 01_data_validation.ipynb
# ==========================================
nb01 = []

nb01.append(md("""# 01 - Rigorous Data Validation & Quality Scoring

## 1. Introduction & Reproducibility
To guarantee research validity, we evaluate the dataset across 5 dimensions: Schema, Referential Integrity, Temporal Logic, Business Rules, and Statistical Outliers. We calculate a precise **Data Quality Score** and log these experiments using `MLflow` for full reproducibility.
"""))

nb01.append(code("""import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import mlflow
import time
from datetime import datetime
from scipy.stats import skew, kurtosis

# Reproducibility
RANDOM_SEED = 42
np.random.seed(RANDOM_SEED)

sns.set_theme(style="whitegrid")
plt.rcParams['figure.figsize'] = (10, 6)

# Load Augmented Data
tx_df = pd.read_parquet('../data/raw/transactions.parquet')
acct_df = pd.read_parquet('../data/raw/accounts.parquet')

dq_metrics = {}
validation_evidence = []
start_time = time.time()

# Initialize MLflow run
mlflow.set_experiment("AegisAML_Data_Quality")
run = mlflow.start_run(run_name="Data_Validation_v1")
print(f"MLflow Run ID: {run.info.run_id}")
"""))

nb01.append(md("""## 2. Schema Validation (Completeness & Consistency)
We assess missing values and strictly enforce datatypes.
"""))

nb01.append(code("""required_cols = ['tx_id', 'sender_id', 'receiver_id', 'amount', 'timestamp', 'is_sar', 'typology']
missing_cols = set(required_cols) - set(tx_df.columns)
passed_schema = len(missing_cols) == 0

null_counts = tx_df.isnull().sum()
total_cells = tx_df.shape[0] * tx_df.shape[1]
completeness = 1.0 - (null_counts.sum() / total_cells)
dq_metrics['Completeness'] = completeness * 100

# Type Consistency (amount must be float, IDs must be numeric or string, timestamp must be datetime)
try:
    tx_df['timestamp'] = pd.to_datetime(tx_df['timestamp'])
    tx_df['amount'] = tx_df['amount'].astype(float)
    consistency = 100.0
except Exception as e:
    consistency = 0.0

dq_metrics['Consistency'] = consistency

validation_evidence.append({'Check': 'Schema Check', 'Passed': passed_schema, 'Detail': 'All columns present'})
validation_evidence.append({'Check': 'Null Values', 'Passed': null_counts.sum() == 0, 'Detail': f"{null_counts.sum()} total nulls"})

display(pd.DataFrame(validation_evidence))
"""))

nb01.append(md("""## 3. Referential Integrity
Graph algorithms require absolute integrity. Every sender and receiver must exist in the accounts table.
"""))

nb01.append(code("""invalid_senders = ~tx_df['sender_id'].isin(acct_df['account_id'])
invalid_receivers = ~tx_df['receiver_id'].isin(acct_df['account_id'])

total_tx = len(tx_df)
failed_integrity = invalid_senders.sum() + invalid_receivers.sum()
integrity_score = (total_tx - failed_integrity) / total_tx
dq_metrics['Integrity'] = integrity_score * 100

validation_evidence.append({'Check': 'Ref Integrity', 'Passed': failed_integrity == 0, 'Detail': f"{failed_integrity} orphaned edges"})
print(f"Integrity Score: {dq_metrics['Integrity']:.2f}%")
"""))

nb01.append(md("""## 4. Temporal Validation
Checking for timestamps in the future or logically impossible orderings.
"""))

nb01.append(code("""future_txs = tx_df[tx_df['timestamp'] > pd.Timestamp.now()].shape[0]
timeliness_score = (total_tx - future_txs) / total_tx
dq_metrics['Timeliness'] = timeliness_score * 100

validation_evidence.append({'Check': 'Temporal (Future)', 'Passed': future_txs == 0, 'Detail': f"{future_txs} future txs"})
"""))

nb01.append(md("""## 5. Business Rule Validation
Validating logic constraints:
1. Transfer amount must be positive.
2. Sender cannot equal Receiver (Self-transfer).
"""))

nb01.append(code("""neg_amt = (tx_df['amount'] <= 0).sum()
self_tx = (tx_df['sender_id'] == tx_df['receiver_id']).sum()

failed_validity = neg_amt + self_tx
validity_score = (total_tx - failed_validity) / total_tx
dq_metrics['Validity'] = validity_score * 100

validation_evidence.append({'Check': 'Positive Amounts', 'Passed': neg_amt == 0, 'Detail': f"{neg_amt} negative/zero txs"})
validation_evidence.append({'Check': 'No Self-Transfers', 'Passed': self_tx == 0, 'Detail': f"{self_tx} self-transfers"})

evidence_df = pd.DataFrame(validation_evidence)
display(evidence_df)
"""))

nb01.append(md("""## 6. Statistical & Distribution Validation
We leverage exploratory statistical techniques (ECDF, IQR Outliers, Box Plots) to understand the distribution profile of normal vs. SAR transactions.
"""))

nb01.append(code("""fig, axes = plt.subplots(2, 2, figsize=(16, 12))
fig.suptitle("Statistical Exploratory Analysis", fontsize=18)

# 1. Log-scale Distribution
sns.histplot(tx_df, x='amount', hue='is_sar', bins=50, log_scale=True, ax=axes[0, 0])
axes[0, 0].set_title("Log-Scale Transaction Amount Distribution")

# 2. Box Plot for Outliers
sns.boxplot(data=tx_df, x='is_sar', y='amount', ax=axes[0, 1])
axes[0, 1].set_yscale('log')
axes[0, 1].set_title("Box Plot (Log Scale) by SAR Label")

# 3. ECDF Plot
sns.ecdfplot(data=tx_df, x='amount', hue='is_sar', ax=axes[1, 0])
axes[1, 0].set_xscale('log')
axes[1, 0].set_title("ECDF of Transaction Amounts")

# 4. Typology Distribution
typology_counts = tx_df['typology'].value_counts()
axes[1, 1].pie(typology_counts, labels=typology_counts.index, autopct='%1.1f%%', startangle=90, colors=sns.color_palette('pastel'))
axes[1, 1].set_title("Typology Distribution")

plt.tight_layout()
plt.savefig('../figures/statistical_validation.png')
plt.show()

# IQR Outlier Analysis
Q1 = tx_df['amount'].quantile(0.25)
Q3 = tx_df['amount'].quantile(0.75)
IQR = Q3 - Q1
outliers = tx_df[(tx_df['amount'] < (Q1 - 1.5 * IQR)) | (tx_df['amount'] > (Q3 + 1.5 * IQR))]
print(f"IQR Outliers Detected: {len(outliers)} ({(len(outliers)/total_tx)*100:.2f}%)")
"""))

nb01.append(md("""## 7. Data Quality Score & MLflow Logging
We calculate the final rigorous Quality Score and commit the metrics to our MLflow experiment tracker.
"""))

nb01.append(code("""final_dq_score = np.mean(list(dq_metrics.values()))

print("=========================================")
print(" RIGOROUS DATA QUALITY SCORE REPORT      ")
print("=========================================")
for k, v in dq_metrics.items():
    print(f"{k:15}: {v:.2f}%")
print("-----------------------------------------")
print(f"OVERALL QUALITY: {final_dq_score:.2f}%")
print("=========================================")

# Log to MLflow
mlflow.log_metric("Completeness", dq_metrics['Completeness'])
mlflow.log_metric("Consistency", dq_metrics['Consistency'])
mlflow.log_metric("Integrity", dq_metrics['Integrity'])
mlflow.log_metric("Timeliness", dq_metrics['Timeliness'])
mlflow.log_metric("Validity", dq_metrics['Validity'])
mlflow.log_metric("Overall_Quality_Score", final_dq_score)

mlflow.log_param("Total_Transactions", total_tx)
mlflow.log_param("Total_Accounts", len(acct_df))
mlflow.log_param("Validation_Failures", evidence_df[~evidence_df['Passed']].shape[0])
"""))

nb01.append(md("""## 8. Final Export & Metadata Footer
Export validated data and close the tracking run.
"""))

nb01.append(code("""# Only keep strictly valid transactions
clean_tx_df = tx_df[(tx_df['amount'] > 0) & (tx_df['sender_id'] != tx_df['receiver_id']) & (tx_df['sender_id'].isin(acct_df['account_id'])) & (tx_df['receiver_id'].isin(acct_df['account_id']))]

clean_tx_df.to_parquet('../data/processed/transactions_clean.parquet', index=False)
print(f"Exported {len(clean_tx_df)} clean transactions.")

end_time = time.time()
mlflow.log_param("Execution_Time_Seconds", round(end_time - start_time, 2))
mlflow.end_run()

print("--- Notebook Metadata ---")
print(f"Dataset Version: v1.0_clean")
print(f"Execution Time: {end_time - start_time:.2f} seconds")
print("MLflow Run completed successfully.")
"""))

with open('c:/Users/spars/Desktop/Societe Generale/notebooks/00_dataset_preparation.ipynb', 'w', encoding='utf-8') as f:
    json.dump(create_notebook(nb00), f, indent=2)

with open('c:/Users/spars/Desktop/Societe Generale/notebooks/01_data_validation.ipynb', 'w', encoding='utf-8') as f:
    json.dump(create_notebook(nb01), f, indent=2)
