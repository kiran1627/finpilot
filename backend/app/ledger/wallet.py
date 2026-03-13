class VirtualWallet:
    """
    Simulated wallet.
    No real money movement.
    """

    def __init__(self, balance: float):
        self.balance = balance
        self.safety_reserve = 0.0
        self.surplus = 0.0

    def move_to_safety(self, amount: float):
        if amount <= self.balance:
            self.balance -= amount
            self.safety_reserve += amount

    def allocate_surplus(self, amount: float):
        if amount <= self.balance:
            self.balance -= amount
            self.surplus += amount
