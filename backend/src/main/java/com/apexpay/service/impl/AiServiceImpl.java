package com.apexpay.service.impl;

import com.apexpay.dto.*;
import com.apexpay.entity.*;
import com.apexpay.entity.enums.PaymentMethod;
import com.apexpay.entity.enums.TransactionType;
import com.apexpay.exception.BusinessException;
import com.apexpay.exception.ResourceNotFoundException;
import com.apexpay.repository.*;
import com.apexpay.repository.admin.FraudAlertRepository;
import com.apexpay.service.AiService;
import com.apexpay.service.AuditService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Slf4j
@Service
public class AiServiceImpl implements AiService {

    private final ChatHistoryRepository chatHistoryRepository;
    private final FinancialInsightRepository financialInsightRepository;
    private final BudgetRecommendationRepository budgetRecommendationRepository;
    private final FinancialScoreRepository financialScoreRepository;
    private final TransactionRepository transactionRepository;
    private final BudgetRepository budgetRepository;
    private final UserRepository userRepository;
    private final FraudAlertRepository fraudAlertRepository;
    private final AuditService auditService;

    @Autowired
    public AiServiceImpl(
            ChatHistoryRepository chatHistoryRepository,
            FinancialInsightRepository financialInsightRepository,
            BudgetRecommendationRepository budgetRecommendationRepository,
            FinancialScoreRepository financialScoreRepository,
            TransactionRepository transactionRepository,
            BudgetRepository budgetRepository,
            UserRepository userRepository,
            FraudAlertRepository fraudAlertRepository,
            AuditService auditService) {
        this.chatHistoryRepository = chatHistoryRepository;
        this.financialInsightRepository = financialInsightRepository;
        this.budgetRecommendationRepository = budgetRecommendationRepository;
        this.financialScoreRepository = financialScoreRepository;
        this.transactionRepository = transactionRepository;
        this.budgetRepository = budgetRepository;
        this.userRepository = userRepository;
        this.fraudAlertRepository = fraudAlertRepository;
        this.auditService = auditService;
    }

    @Override
    @Transactional
    public ChatResponse chat(UUID userId, ChatRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String userMessage = request.message();
        
        // 1. Save User Message
        ChatHistory userChat = new ChatHistory();
        userChat.setUser(user);
        userChat.setRole("USER");
        userChat.setMessage(userMessage);
        chatHistoryRepository.save(userChat);

        // 2. Generate AI Assistant Response
        String botResponse = generateAiResponse(userId, userMessage);

        // 3. Save Assistant Message
        ChatHistory botChat = new ChatHistory();
        botChat.setUser(user);
        botChat.setRole("ASSISTANT");
        botChat.setMessage(botResponse);
        chatHistoryRepository.save(botChat);

        // 4. Write Audit Log
        auditService.log("AI_CHAT_INQUIRY", user.getUsername(), "ChatHistory", botChat.getId().toString());

        return new ChatResponse(botResponse, botChat.getCreatedAt());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChatHistoryResponse> getChatHistory(UUID userId) {
        return chatHistoryRepository.findByUserIdOrderByCreatedAtAsc(userId).stream()
                .map(c -> new ChatHistoryResponse(c.getId(), c.getRole(), c.getMessage(), c.getCreatedAt()))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public List<FinancialInsightResponse> getInsights(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Generate insights dynamically to ensure they are fresh, then save/return
        generateAndSaveFreshInsights(user);

        return financialInsightRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(i -> new FinancialInsightResponse(i.getId(), i.getType(), i.getTitle(), i.getDescription(), i.getCreatedAt()))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public FinancialSummaryResponse getSummary(UUID userId) {
        List<Transaction> txList = transactionRepository.findSuccessTransactionsByUserId(userId);
        
        BigDecimal totalIncome = BigDecimal.ZERO;
        BigDecimal totalExpenses = BigDecimal.ZERO;
        Map<String, BigDecimal> categoryBreakdown = new HashMap<>();
        Map<DayOfWeek, BigDecimal> daySpending = new HashMap<>();
        Map<String, Integer> merchantFrequency = new HashMap<>();
        Map<PaymentMethod, BigDecimal> paymentMethodSpending = new HashMap<>();

        for (Transaction tx : txList) {
            boolean isSender = tx.getSenderWallet() != null && tx.getSenderWallet().getUser().getId().equals(userId);
            boolean isReceiver = tx.getReceiverWallet() != null && tx.getReceiverWallet().getUser().getId().equals(userId);

            if (isSender && tx.getTransactionType() != TransactionType.DEPOSIT) {
                // Expense (debit)
                BigDecimal amount = tx.getAmount();
                totalExpenses = totalExpenses.add(amount);

                // Category Breakdown
                String cat = tx.getCategory() != null ? tx.getCategory().toUpperCase() : "OTHER";
                categoryBreakdown.put(cat, categoryBreakdown.getOrDefault(cat, BigDecimal.ZERO).add(amount));

                // Day of Week
                DayOfWeek day = tx.getCreatedAt().getDayOfWeek();
                daySpending.put(day, daySpending.getOrDefault(day, BigDecimal.ZERO).add(amount));

                // Merchant Frequency
                String recipientName = "Transfer/Unknown";
                if (tx.getReceiverWallet() != null) {
                    recipientName = tx.getReceiverWallet().getUser().getFullName();
                } else if (tx.getRemarks() != null) {
                    recipientName = tx.getRemarks();
                }
                merchantFrequency.put(recipientName, merchantFrequency.getOrDefault(recipientName, 0) + 1);

                // Payment Method
                PaymentMethod method = tx.getPaymentMethod();
                paymentMethodSpending.put(method, paymentMethodSpending.getOrDefault(method, BigDecimal.ZERO).add(amount));
            }

            if (isReceiver && tx.getTransactionType() != TransactionType.WITHDRAW) {
                // Income (credit)
                totalIncome = totalIncome.add(tx.getAmount());
            }
        }

        BigDecimal netSavings = totalIncome.subtract(totalExpenses);
        BigDecimal savingsRate = BigDecimal.ZERO;
        if (totalIncome.compareTo(BigDecimal.ZERO) > 0) {
            savingsRate = netSavings.multiply(BigDecimal.valueOf(100)).divide(totalIncome, 2, RoundingMode.HALF_UP);
        }

        // Highest spending day
        String highestSpendingDay = daySpending.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(e -> e.getKey().toString())
                .orElse("None");

        // Most frequent merchant
        String mostFrequentMerchant = merchantFrequency.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("None");

        // Most used payment method
        String mostUsedPaymentMethod = paymentMethodSpending.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(e -> e.getKey().toString())
                .orElse("None");

        return new FinancialSummaryResponse(
                totalIncome,
                totalExpenses,
                netSavings,
                savingsRate,
                highestSpendingDay,
                mostFrequentMerchant,
                mostUsedPaymentMethod,
                categoryBreakdown
        );
    }

    @Override
    @Transactional
    public List<BudgetRecommendationResponse> getBudgetRecommendations(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        generateFreshBudgetRecommendations(user);

        return budgetRecommendationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(r -> new BudgetRecommendationResponse(
                        r.getId(),
                        r.getCategory(),
                        r.getRecommendedAmount(),
                        r.getCurrentSpending(),
                        r.getReasoning(),
                        r.getIsApplied()
                )).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public BudgetRecommendationResponse applyBudgetRecommendation(UUID userId, UUID recommendationId) {
        BudgetRecommendation rec = budgetRecommendationRepository.findById(recommendationId)
                .orElseThrow(() -> new ResourceNotFoundException("Recommendation not found"));

        if (!rec.getUser().getId().equals(userId)) {
            throw new BusinessException("Unauthorized to apply this recommendation");
        }

        if (rec.getIsApplied()) {
            throw new BusinessException("This recommendation has already been applied");
        }

        // Apply it to the real budgets table for the current month
        String currentMonth = DateTimeFormatter.ofPattern("yyyy-MM").format(LocalDate.now());
        
        Optional<Budget> existingOpt = budgetRepository.findByUserIdAndCategoryAndMonth(userId, rec.getCategory(), currentMonth);
        Budget budget;
        if (existingOpt.isPresent()) {
            budget = existingOpt.get();
            budget.setAmountLimit(rec.getRecommendedAmount());
        } else {
            budget = new Budget();
            budget.setUser(rec.getUser());
            budget.setCategory(rec.getCategory());
            budget.setAmountLimit(rec.getRecommendedAmount());
            budget.setMonth(currentMonth);
            budget.setSpent(rec.getCurrentSpending());
        }
        
        budgetRepository.save(budget);

        // Mark recommendation as applied
        rec.setIsApplied(true);
        budgetRecommendationRepository.save(rec);

        auditService.log("APPLY_BUDGET_RECOMMENDATION", rec.getUser().getUsername(), "Budget", budget.getId().toString());

        return new BudgetRecommendationResponse(
                rec.getId(),
                rec.getCategory(),
                rec.getRecommendedAmount(),
                rec.getCurrentSpending(),
                rec.getReasoning(),
                rec.getIsApplied()
        );
    }

    @Override
    @Transactional
    public FinancialHealthResponse getFinancialHealthScore(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<Transaction> txList = transactionRepository.findSuccessTransactionsByUserId(userId);
        
        // 1. Evaluate Savings Rate
        BigDecimal totalIncome = BigDecimal.ZERO;
        BigDecimal totalExpenses = BigDecimal.ZERO;
        boolean hasInvestment = false;

        for (Transaction tx : txList) {
            boolean isSender = tx.getSenderWallet() != null && tx.getSenderWallet().getUser().getId().equals(userId);
            boolean isReceiver = tx.getReceiverWallet() != null && tx.getReceiverWallet().getUser().getId().equals(userId);

            if (isSender) {
                totalExpenses = totalExpenses.add(tx.getAmount());
                if ("INVESTMENT".equalsIgnoreCase(tx.getCategory())) {
                    hasInvestment = true;
                }
            }
            if (isReceiver) {
                totalIncome = totalIncome.add(tx.getAmount());
            }
        }

        BigDecimal savingsRate = BigDecimal.ZERO;
        BigDecimal netSavings = totalIncome.subtract(totalExpenses);
        if (totalIncome.compareTo(BigDecimal.ZERO) > 0) {
            savingsRate = netSavings.multiply(BigDecimal.valueOf(100)).divide(totalIncome, 2, RoundingMode.HALF_UP);
        }

        int score = 0;
        List<String> factors = new ArrayList<>();

        // Savings Rate Factor (up to 40 pts)
        if (savingsRate.compareTo(BigDecimal.valueOf(30)) >= 0) {
            score += 40;
            factors.add("Excellent Savings Rate: You are saving more than 30% of your income. (+40 pts)");
        } else if (savingsRate.compareTo(BigDecimal.valueOf(15)) >= 0) {
            score += 25;
            factors.add("Healthy Savings Rate: You save between 15% and 30% of your income. (+25 pts)");
        } else if (savingsRate.compareTo(BigDecimal.ZERO) >= 0) {
            score += 15;
            factors.add("Low Savings Rate: Try to increase your monthly savings. (+15 pts)");
        } else {
            factors.add("Negative Savings: Your expenses exceed your monthly income. (+0 pts)");
        }

        // Budget Adherence (up to 30 pts)
        String currentMonth = DateTimeFormatter.ofPattern("yyyy-MM").format(LocalDate.now());
        List<Budget> budgets = budgetRepository.findByUserIdAndMonth(userId, currentMonth);
        int exceededBudgets = 0;
        for (Budget b : budgets) {
            if (b.getSpent().compareTo(b.getAmountLimit()) > 0) {
                exceededBudgets++;
            }
        }
        
        if (budgets.isEmpty()) {
            score += 20;
            factors.add("No Budgets Configured: Set category limits to better track your spending. (+20 pts)");
        } else if (exceededBudgets == 0) {
            score += 30;
            factors.add("Perfect Budget Adherence: You stayed within all set category limits. (+30 pts)");
        } else if (exceededBudgets == 1) {
            score += 15;
            factors.add("Warning: You exceeded 1 category budget this month. (+15 pts)");
        } else {
            factors.add("Critical: Exceeded multiple category budgets. (+0 pts)");
        }

        // Investment Activity (up to 20 pts)
        if (hasInvestment) {
            score += 20;
            factors.add("Investment Growth: You are building long-term wealth through investments. (+20 pts)");
        } else {
            factors.add("No Investment Activity: Consider routing savings to investments. (+0 pts)");
        }

        // Fraud & Safety (up to 10 pts)
        long alertCount = fraudAlertRepository.findByUserId(userId).stream()
                .filter(fa -> "HIGH".equals(fa.getRiskLevel()) || "CRITICAL".equals(fa.getRiskLevel()))
                .count();

        if (alertCount == 0) {
            score += 10;
            factors.add("Secure Transactions: Excellent security log with no critical fraud threats. (+10 pts)");
        } else {
            factors.add("Security Flag: Your profile has high-risk security alerts flagged. (+0 pts)");
        }

        String billHistory = "EXCELLENT";
        if (exceededBudgets > 1) {
            billHistory = "POOR";
        } else if (exceededBudgets == 1) {
            billHistory = "GOOD";
        }

        // Retrieve existing score or create new
        FinancialScore scoreEntity = financialScoreRepository.findFirstByUserIdOrderByCreatedAtDesc(userId)
                .orElse(new FinancialScore());
        
        scoreEntity.setUser(user);
        scoreEntity.setScore(score);
        scoreEntity.setSavingsRate(savingsRate);
        scoreEntity.setBudgetAdherence(budgets.isEmpty() ? BigDecimal.ZERO : BigDecimal.valueOf(100 - (exceededBudgets * 100 / budgets.size())));
        scoreEntity.setBillPaymentHistory(billHistory);
        scoreEntity.setFactorBreakdown(String.join("\n", factors));

        financialScoreRepository.save(scoreEntity);

        return new FinancialHealthResponse(
                scoreEntity.getId(),
                scoreEntity.getScore(),
                scoreEntity.getSavingsRate(),
                scoreEntity.getBudgetAdherence(),
                scoreEntity.getBillPaymentHistory(),
                scoreEntity.getFactorBreakdown(),
                scoreEntity.getUpdatedAt()
        );
    }

    // ==========================================
    // AI Chat Engine Internal Helper Methods
    // ==========================================
    private String generateAiResponse(UUID userId, String prompt) {
        String p = prompt.toLowerCase().trim();

        // 1. "How much did I spend this month?"
        if (p.contains("spend") && (p.contains("this month") || p.contains("current month") || p.contains("how much did i"))) {
            BigDecimal spent = getSpentAmountForMonth(userId, LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM")));
            return String.format("You have spent ₹%,.2f in total this month from your ApexPay wallet.", spent);
        }

        // 2. "Show my [Category] expenses." / "How much did I spend on [Category]"
        for (String cat : Arrays.asList("food", "shopping", "recharge", "travel", "bills", "entertainment", "education", "medical", "investment", "salary", "transfer")) {
            if (p.contains(cat)) {
                BigDecimal spent = getSpentAmountForCategory(userId, cat.toUpperCase());
                return String.format("Your total spending on %s this month is ₹%,.2f.", cat.toUpperCase(), spent);
            }
        }

        // 3. "What is my biggest expense?"
        if (p.contains("biggest") || p.contains("largest") || p.contains("maximum expense")) {
            Transaction maxTx = getBiggestExpense(userId);
            if (maxTx != null) {
                String details = maxTx.getReceiverWallet() != null ? maxTx.getReceiverWallet().getUser().getFullName() : (maxTx.getRemarks() != null ? maxTx.getRemarks() : "Unknown");
                return String.format("Your biggest single expense this month was a payment of ₹%,.2f to %s on %s for category %s.",
                        maxTx.getAmount(), details, maxTx.getCreatedAt().format(DateTimeFormatter.ofPattern("dd-MMM-yyyy")), maxTx.getCategory());
            } else {
                return "I couldn't find any transaction records for you this month.";
            }
        }

        // 4. "Who received the most money?"
        if (p.contains("received") && (p.contains("most money") || p.contains("most"))) {
            Map.Entry<String, BigDecimal> recipient = getTopRecipient(userId);
            if (recipient != null) {
                return String.format("The recipient who has received the most money from you is %s with a total of ₹%,.2f.", recipient.getKey(), recipient.getValue());
            } else {
                return "You have not transferred money to anyone this month yet.";
            }
        }

        // 5. "Suggest a monthly budget."
        if (p.contains("suggest") && p.contains("budget")) {
            BigDecimal totalSpend = getSpentAmountForMonth(userId, LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM")));
            if (totalSpend.compareTo(BigDecimal.ZERO) == 0) {
                return "Since you have no spending logs yet, I suggest starting with a general monthly budget of ₹10,000 distributed as: FOOD (30%), UTILITIES (20%), TRAVEL (20%), others (30%).";
            }
            BigDecimal suggested = totalSpend.multiply(BigDecimal.valueOf(0.9)).setScale(0, RoundingMode.HALF_UP);
            return String.format("Based on your monthly velocity of ₹%,.2f, I suggest configuring a target budget limit of ₹%,.2f for the next month to increase your savings rate by 10%%.", totalSpend, suggested);
        }

        // 6. "Show transactions above ₹5000."
        if (p.contains("above") || p.contains("greater than") || p.contains("more than")) {
            BigDecimal threshold = parseAmount(prompt);
            if (threshold != null) {
                List<Transaction> txs = getTransactionsAbove(userId, threshold);
                if (txs.isEmpty()) {
                    return String.format("I found no transactions above ₹%,.2f for you this month.", threshold);
                }
                StringBuilder sb = new StringBuilder(String.format("Found %d transaction(s) above ₹%,.2f:\n", txs.size(), threshold));
                for (Transaction tx : txs) {
                    sb.append(String.format("• ₹%,.2f - %s (Ref: %s, %s)\n",
                            tx.getAmount(),
                            tx.getReceiverWallet() != null ? tx.getReceiverWallet().getUser().getFullName() : (tx.getRemarks() != null ? tx.getRemarks() : "Merchant"),
                            tx.getTransactionReference().substring(0, 8),
                            tx.getCreatedAt().format(DateTimeFormatter.ofPattern("dd-MMM"))));
                }
                return sb.toString();
            }
        }

        // 7. "How much did I save?"
        if (p.contains("save") || p.contains("savings")) {
            FinancialSummaryResponse summary = getSummary(userId);
            return String.format("This month, you received ₹%,.2f and spent ₹%,.2f. Your net savings are ₹%,.2f (Savings Rate: %s%%).",
                    summary.totalIncome(), summary.totalExpenses(), summary.netSavings(), summary.savingsRate());
        }

        // 8. "Show last month's UPI payments"
        if (p.contains("last month") && p.contains("upi")) {
            List<Transaction> upiTxs = transactionRepository.findSuccessTransactionsByUserId(userId).stream()
                    .filter(tx -> tx.getPaymentMethod() == PaymentMethod.UPI)
                    .filter(tx -> tx.getCreatedAt().isAfter(LocalDateTime.now().minusMonths(1).withDayOfMonth(1)) &&
                            tx.getCreatedAt().isBefore(LocalDateTime.now().withDayOfMonth(1)))
                    .collect(Collectors.toList());

            if (upiTxs.isEmpty()) {
                return "You had no UPI transactions last month.";
            }
            StringBuilder sb = new StringBuilder("Here are your UPI payments from last month:\n");
            for (Transaction tx : upiTxs) {
                sb.append(String.format("• ₹%,.2f - %s (on %s)\n",
                        tx.getAmount(),
                        tx.getReceiverWallet() != null ? tx.getReceiverWallet().getUser().getFullName() : (tx.getRemarks() != null ? tx.getRemarks() : "UPI Merchant"),
                        tx.getCreatedAt().format(DateTimeFormatter.ofPattern("dd-MMM"))));
            }
            return sb.toString();
        }

        // 9. "Find transactions to Rahul"
        if (p.contains("find") || p.contains("show transactions to")) {
            // Find any name mentioned in the string
            String targetName = extractTargetName(prompt);
            if (targetName != null) {
                List<Transaction> matches = transactionRepository.findSuccessTransactionsByUserId(userId).stream()
                        .filter(tx -> {
                            String name = "";
                            if (tx.getReceiverWallet() != null) {
                                name = tx.getReceiverWallet().getUser().getFullName();
                            } else if (tx.getRemarks() != null) {
                                name = tx.getRemarks();
                            }
                            return name.toLowerCase().contains(targetName.toLowerCase());
                        }).collect(Collectors.toList());

                if (matches.isEmpty()) {
                    return String.format("No transactions found matching recipient name '%s'.", targetName);
                }
                StringBuilder sb = new StringBuilder(String.format("Found %d transaction(s) to '%s':\n", matches.size(), targetName));
                for (Transaction tx : matches) {
                    sb.append(String.format("• ₹%,.2f - %s (on %s, Status: %s)\n",
                            tx.getAmount(),
                            tx.getRemarks() != null ? tx.getRemarks() : "Wallet Transfer",
                            tx.getCreatedAt().format(DateTimeFormatter.ofPattern("dd-MMM-yyyy")),
                            tx.getPaymentStatus()));
                }
                return sb.toString();
            }
        }

        // General Fallback
        return "Hi there! I am your AI Financial Assistant. Here are some inquiries you can ask me:\n" +
                "• 'How much did I spend this month?'\n" +
                "• 'Show my food expenses.'\n" +
                "• 'What is my biggest expense?'\n" +
                "• 'Who received the most money?'\n" +
                "• 'Suggest a monthly budget.'\n" +
                "• 'Show transactions above ₹5000.'\n" +
                "• 'How much did I save?'\n" +
                "• 'Find transactions to [Name]'";
    }

    private BigDecimal getSpentAmountForMonth(UUID userId, String month) {
        return transactionRepository.findSuccessTransactionsByUserId(userId).stream()
                .filter(tx -> tx.getSenderWallet() != null && tx.getSenderWallet().getUser().getId().equals(userId))
                .filter(tx -> tx.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM")).equals(month))
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal getSpentAmountForCategory(UUID userId, String category) {
        return transactionRepository.findSuccessTransactionsByUserId(userId).stream()
                .filter(tx -> tx.getSenderWallet() != null && tx.getSenderWallet().getUser().getId().equals(userId))
                .filter(tx -> category.equalsIgnoreCase(tx.getCategory()))
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private Transaction getBiggestExpense(UUID userId) {
        return transactionRepository.findSuccessTransactionsByUserId(userId).stream()
                .filter(tx -> tx.getSenderWallet() != null && tx.getSenderWallet().getUser().getId().equals(userId))
                .filter(tx -> tx.getTransactionType() != TransactionType.DEPOSIT)
                .max(Comparator.comparing(Transaction::getAmount))
                .orElse(null);
    }

    private Map.Entry<String, BigDecimal> getTopRecipient(UUID userId) {
        Map<String, BigDecimal> recipientMap = new HashMap<>();
        List<Transaction> txList = transactionRepository.findSuccessTransactionsByUserId(userId).stream()
                .filter(tx -> tx.getSenderWallet() != null && tx.getSenderWallet().getUser().getId().equals(userId))
                .collect(Collectors.toList());

        for (Transaction tx : txList) {
            String name = tx.getReceiverWallet() != null ? tx.getReceiverWallet().getUser().getFullName() : (tx.getRemarks() != null ? tx.getRemarks() : "Unknown");
            recipientMap.put(name, recipientMap.getOrDefault(name, BigDecimal.ZERO).add(tx.getAmount()));
        }

        return recipientMap.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .orElse(null);
    }

    private List<Transaction> getTransactionsAbove(UUID userId, BigDecimal threshold) {
        return transactionRepository.findSuccessTransactionsByUserId(userId).stream()
                .filter(tx -> tx.getSenderWallet() != null && tx.getSenderWallet().getUser().getId().equals(userId))
                .filter(tx -> tx.getAmount().compareTo(threshold) > 0)
                .collect(Collectors.toList());
    }

    private BigDecimal parseAmount(String prompt) {
        Pattern pattern = Pattern.compile("\\b(\\d+)\\b");
        Matcher matcher = pattern.matcher(prompt);
        if (matcher.find()) {
            return new BigDecimal(matcher.group(1));
        }
        return null;
    }

    private String extractTargetName(String prompt) {
        String p = prompt.toLowerCase();
        int idx = p.indexOf("to");
        if (idx != -1 && idx + 3 < prompt.length()) {
            return prompt.substring(idx + 3).trim();
        }
        // Fallback: search for words in title case
        String[] words = prompt.split("\\s+");
        for (int i = 1; i < words.length; i++) {
            if (Character.isUpperCase(words[i].charAt(0)) && !words[i-1].equalsIgnoreCase("show") && !words[i-1].equalsIgnoreCase("find")) {
                return words[i];
            }
        }
        return null;
    }

    // ==========================================
    // Dynamic Smart Insights Generator Helpers
    // ==========================================
    private void generateAndSaveFreshInsights(User user) {
        UUID userId = user.getId();
        List<Transaction> txs = transactionRepository.findSuccessTransactionsByUserId(userId);
        
        // Avoid writing insight spam: delete old daily/weekly insights first
        List<FinancialInsight> oldInsights = financialInsightRepository.findByUserIdOrderByCreatedAtDesc(userId);
        financialInsightRepository.deleteAll(oldInsights);

        // 1. Spending Insight
        Map<String, BigDecimal> categorySpending = new HashMap<>();
        BigDecimal totalSpend = BigDecimal.ZERO;
        for (Transaction tx : txs) {
            if (tx.getSenderWallet() != null && tx.getSenderWallet().getUser().getId().equals(userId)) {
                String cat = tx.getCategory() != null ? tx.getCategory().toUpperCase() : "OTHER";
                categorySpending.put(cat, categorySpending.getOrDefault(cat, BigDecimal.ZERO).add(tx.getAmount()));
                totalSpend = totalSpend.add(tx.getAmount());
            }
        }

        if (totalSpend.compareTo(BigDecimal.ZERO) > 0) {
            Map.Entry<String, BigDecimal> topCat = categorySpending.entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .orElse(null);
            
            if (topCat != null) {
                FinancialInsight insight = new FinancialInsight();
                insight.setUser(user);
                insight.setType("SPENDING");
                insight.setTitle("Top Expense Category: " + topCat.getKey());
                BigDecimal pct = topCat.getValue().multiply(BigDecimal.valueOf(100)).divide(totalSpend, 2, RoundingMode.HALF_UP);
                insight.setDescription(String.format("You have spent ₹%,.2f on %s, which constitutes %s%% of your total expenses this month.",
                        topCat.getValue(), topCat.getKey(), pct));
                financialInsightRepository.save(insight);
            }
        }

        // 2. Savings Insight
        FinancialSummaryResponse summary = getSummary(userId);
        FinancialInsight savingsInsight = new FinancialInsight();
        savingsInsight.setUser(user);
        savingsInsight.setType("MONTHLY");
        if (summary.savingsRate().compareTo(BigDecimal.valueOf(20)) >= 0) {
            savingsInsight.setTitle("Excellent Savings Drive!");
            savingsInsight.setDescription(String.format("Great job! Your savings rate is at a solid %s%% this month, saving ₹%,.2f net.",
                    summary.savingsRate(), summary.netSavings()));
        } else if (summary.savingsRate().compareTo(BigDecimal.ZERO) >= 0) {
            savingsInsight.setTitle("Moderate Savings Alert");
            savingsInsight.setDescription(String.format("Your savings rate is at %s%% (₹%,.2f). We suggest setting budget limits on top categories to push it above 20%%.",
                    summary.savingsRate(), summary.netSavings()));
        } else {
            savingsInsight.setTitle("Budget Overdraft Warning");
            savingsInsight.setDescription(String.format("Caution: Your expenses exceed your income this month by ₹%,.2f. Review your budget suggestions to trim overhead.",
                    summary.netSavings().abs()));
        }
        financialInsightRepository.save(savingsInsight);

        // 3. Subscription Detection
        // If there are multiple transactions to the same receiver with exactly the same amount in the past 90 days at regular intervals
        detectAndSaveSubscriptions(user, txs);

        // 4. Simulated Bill Reminder
        FinancialInsight billInsight = new FinancialInsight();
        billInsight.setUser(user);
        billInsight.setType("GENERAL");
        billInsight.setTitle("Bill Due Suggestion");
        billInsight.setDescription("ApexPay detected regular utilities usage in past cycles. Your electricity and broadband bills are typically due around the 20th of the month.");
        financialInsightRepository.save(billInsight);

        // 5. Cashback Promotion Simulation
        FinancialInsight promoInsight = new FinancialInsight();
        promoInsight.setUser(user);
        promoInsight.setType("GENERAL");
        promoInsight.setTitle("Smart Cashback Recommendation");
        promoInsight.setDescription("ApexPay Tip: Get 5% cashback up to ₹150 this week on all entertainment recharges done via ApexPay UPI.");
        financialInsightRepository.save(promoInsight);
    }

    private void detectAndSaveSubscriptions(User user, List<Transaction> txs) {
        UUID userId = user.getId();
        // Group transactions by receiver name + amount
        Map<String, List<Transaction>> recurringGroup = new HashMap<>();
        for (Transaction tx : txs) {
            if (tx.getSenderWallet() != null && tx.getSenderWallet().getUser().getId().equals(userId)) {
                String receiver = tx.getReceiverWallet() != null ? tx.getReceiverWallet().getUser().getFullName() : (tx.getRemarks() != null ? tx.getRemarks() : "Unknown");
                String key = receiver + "_" + tx.getAmount().setScale(2, RoundingMode.HALF_UP);
                recurringGroup.computeIfAbsent(key, k -> new ArrayList<>()).add(tx);
            }
        }

        for (Map.Entry<String, List<Transaction>> entry : recurringGroup.entrySet()) {
            List<Transaction> group = entry.getValue();
            if (group.size() >= 2) {
                // Check if dates are roughly 30 days apart
                group.sort(Comparator.comparing(Transaction::getCreatedAt));
                boolean matchesInterval = false;
                for (int i = 1; i < group.size(); i++) {
                    long daysBetween = java.time.temporal.ChronoUnit.DAYS.between(group.get(i-1).getCreatedAt(), group.get(i).getCreatedAt());
                    if (daysBetween >= 25 && daysBetween <= 35) {
                        matchesInterval = true;
                        break;
                    }
                }

                if (matchesInterval) {
                    String[] parts = entry.getKey().split("_");
                    String receiverName = parts[0];
                    String amountStr = parts[1];

                    FinancialInsight subInsight = new FinancialInsight();
                    subInsight.setUser(user);
                    subInsight.setType("GENERAL");
                    subInsight.setTitle("Recurring Subscription Detected");
                    subInsight.setDescription(String.format("ApexPay detected a recurring monthly payment of ₹%s to %s. Consider managing subscriptions to save cash.",
                            amountStr, receiverName));
                    financialInsightRepository.save(subInsight);
                    break; // Only save one detected subscription for demo limits
                }
            }
        }
    }

    private void generateFreshBudgetRecommendations(User user) {
        UUID userId = user.getId();
        List<Transaction> txs = transactionRepository.findSuccessTransactionsByUserId(userId);
        
        // Calculate spending per category in current month
        Map<String, BigDecimal> categorySpending = new HashMap<>();
        for (Transaction tx : txs) {
            if (tx.getSenderWallet() != null && tx.getSenderWallet().getUser().getId().equals(userId)) {
                String cat = tx.getCategory() != null ? tx.getCategory().toUpperCase() : "OTHER";
                categorySpending.put(cat, categorySpending.getOrDefault(cat, BigDecimal.ZERO).add(tx.getAmount()));
            }
        }

        // Wipe old recommendations that aren't applied to keep recommendations fresh
        List<BudgetRecommendation> oldRecs = budgetRecommendationRepository.findByUserIdAndIsApplied(userId, false);
        budgetRecommendationRepository.deleteAll(oldRecs);

        // Generate recommendations for active spending categories
        for (Map.Entry<String, BigDecimal> entry : categorySpending.entrySet()) {
            String cat = entry.getKey();
            BigDecimal spent = entry.getValue();

            if (spent.compareTo(BigDecimal.valueOf(100)) > 0) {
                // Recommend budget to be spent * 1.10 rounded to next 100
                BigDecimal recommended = spent.multiply(BigDecimal.valueOf(1.10)).divide(BigDecimal.valueOf(100), 0, RoundingMode.CEILING).multiply(BigDecimal.valueOf(100));
                
                // Avoid recommending lower than 500
                if (recommended.compareTo(BigDecimal.valueOf(500)) < 0) {
                    recommended = BigDecimal.valueOf(500);
                }

                BudgetRecommendation rec = new BudgetRecommendation();
                rec.setUser(user);
                rec.setCategory(cat);
                rec.setRecommendedAmount(recommended);
                rec.setCurrentSpending(spent);
                rec.setIsApplied(false);
                rec.setReasoning(String.format("Your current monthly velocity for %s is ₹%,.2f. We recommend a limit of ₹%,.2f to establish a healthy financial ceiling.",
                        cat, spent, recommended));

                budgetRecommendationRepository.save(rec);
            }
        }
    }
}
