import psycopg2

try:
    conn = psycopg2.connect(
        dbname="defaultdb",
        user="sparsh",
        password="Whitedevil918@",
        host="wise-nymph-30228.j77.aws-ap-south-1.cockroachlabs.cloud",
        port=26257,
        sslmode="verify-full",
        sslrootcert="system"
    )
    print("SUCCESS: Connected successfully via kwargs!")
    conn.close()
except Exception as e:
    print(f"FAILED via kwargs: {e}")

try:
    conn = psycopg2.connect(
        dbname="defaultdb",
        user="sparsh",
        password="Whitedevil918@@",
        host="wise-nymph-30228.j77.aws-ap-south-1.cockroachlabs.cloud",
        port=26257,
        sslmode="verify-full",
        sslrootcert="system"
    )
    print("SUCCESS: Connected successfully via kwargs (double @)!")
    conn.close()
except Exception as e:
    print(f"FAILED via kwargs (double @): {e}")

