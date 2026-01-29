/**
 * 1️⃣ تقدير كل مادة (Subject Grade) - منطق وزاري
 * 
 * يعتمد فقط على درجة المادة نفسها (مطابق لصيغة Excel):
 * =IF(score>=90,"امتياز",IF(score>=80,"جيد جداً",IF(score>=70,"جيد",IF(score>=60,"متوسط",IF(score>=50,"مقبول","راسب")))))
 * 
 * Grade ranges:
 * - score >= 90 → "امتياز"
 * - score >= 80 → "جيد جداً"
 * - score >= 70 → "جيد"
 * - score >= 60 → "متوسط"
 * - score >= 50 → "مقبول"
 * - score < 50  → "راسب"
 */
export function calculateGrade(score: number | string | null | undefined): string {
  // Safety guard: convert to number, default to 0 if invalid
  const safeScore = Number(score) || 0;
  
  if (safeScore >= 90) return "امتياز";
  if (safeScore >= 80) return "جيد جداً";
  if (safeScore >= 70) return "جيد";
  if (safeScore >= 60) return "متوسط";
  if (safeScore >= 50) return "مقبول";
  return "راسب";
}

/**
 * 4️⃣ التقييم النهائي (Final Evaluation) - منطق وزاري
 * 
 * ⚠️ IMPORTANT: التقييم منطقُه نفس منطق التقدير تمامًا، لكن الفرق الأساسي:
 * ✅ التقييم لا يعتمد على درجة مادة (Subject Score)
 * ✅ التقييم يعتمد فقط على قيمة (المعدل النهائي) - Average
 * 
 * ============================================================
 * 🔹 منطق التقييم (مطابق للوزاري):
 * ============================================================
 * 
 * التقييم يُحسب من المعدل فقط:
 * - إذا كان المعدل >= 90 → "امتياز"
 * - إذا كان المعدل >= 80 → "جيد جداً"
 * - إذا كان المعدل >= 70 → "جيد"
 * - إذا كان المعدل >= 60 → "متوسط"
 * - إذا كان المعدل >= 50 → "مقبول"
 * - إذا كان المعدل < 50  → "راسب"
 * 
 * (مطابق لصيغة Excel):
 * =IF(AH15>=90,"امتياز",IF(AH15>=80,"جيد جداً",IF(AH15>=70,"جيد",IF(AH15>=60,"متوسط",IF(AH15>=50,"مقبول","راسب")))))
 * 
 * حيث AH15 = المعدل النهائي (Average)
 * 
 * ============================================================
 * 
 * ملاحظات إلزامية:
 * - يتم حساب التقييم تلقائيًا بعد حساب المعدل
 * - يدعم الكسور العشرية (مثال: 63.18 → "متوسط")
 * - يُستخدم نفس التقريب المعتمد للمعدل (خانتين عشريتين) قبل التقييم
 * - التقييم يُحسب دائماً من المعدل، ولا يُقرأ من Excel أبداً
 * - التقييم لا يعتمد على درجة مادة منفردة
 * - التقييم لا يعتمد على أدنى درجة (MIN)
 * - التقييم لا يعتمد على المجموع الكلي
 * 
 * ⚠️ IMPORTANT: Only depends on average, NOT on:
 * - finalNumeric (MIN of subject scores)
 * - total score
 * - individual subject scores
 * - Excel evaluation column (if exists)
 */
export function calculateFinalEvaluation(average: number | string | null | undefined): string {
  // ⚠️ IMPORTANT: Convert to number, default to 0 if invalid
  // This handles decimal values correctly (e.g., 63.18)
  // Evaluation is calculated from average ONLY, NOT from subject scores, NOT from Excel
  const safeAverage = Number(average) || 0;
  
  // ⚠️ CRITICAL: Apply evaluation logic based on average value ONLY
  // Supports decimal values (e.g., 63.18 will be evaluated as "متوسط")
  // Same logic as calculateGrade, but applied to average instead of subject score
  // 
  // Ministerial Logic (مطابق للوزاري):
  // - إذا كان المعدل >= 90 → "امتياز"
  // - إذا كان المعدل >= 80 → "جيد جداً"
  // - إذا كان المعدل >= 70 → "جيد"
  // - إذا كان المعدل >= 60 → "متوسط"
  // - إذا كان المعدل >= 50 → "مقبول"
  // - إذا كان المعدل < 50 → "راسب"
  //
  // ⚠️ IMPORTANT: This function ONLY depends on average
  // NOT on: finalNumeric (MIN), total score, individual subject scores, Excel evaluation column
  if (safeAverage >= 90) return "امتياز";
  if (safeAverage >= 80) return "جيد جداً";
  if (safeAverage >= 70) return "جيد";
  if (safeAverage >= 60) return "متوسط";
  if (safeAverage >= 50) return "مقبول";
  return "راسب";
}

/**
 * 2️⃣ النتيجة النهائية الرقمية (Final Numeric Result) - منطق وزاري
 * 
 * ⚠️ IMPORTANT: يتم فحص جميع درجات المواد الخاصة بالطالب واستخراج أقل درجة (MIN)
 * 
 * تُحسب كأقل درجة بين جميع المواد (مطابق لصيغة Excel):
 * =MIN(E15,I15,M15,Q15,U15,Y15,AC15)
 * 
 * final_score = MIN(درجات جميع المواد)
 * 
 * ⚠️ IMPORTANT: 
 * - This is the MINIMUM score among all subjects
 * - NOT the average or total
 * - NOT dependent on units or any other factor
 * 
 * @param subjectScores Array of subject scores (numbers or strings)
 * @returns The minimum score, or 0 if no valid scores
 */
export function calculateFinalNumeric(subjectScores: Array<number | string | null | undefined>): number {
  // Convert all scores to numbers and filter out invalid values
  const validScores = subjectScores
    .map(score => {
      const num = Number(score);
      return isNaN(num) ? null : num;
    })
    .filter((score): score is number => score !== null);
  
  // If no valid scores, return 0
  if (validScores.length === 0) return 0;
  
  // Return the minimum score among all subjects
  return Math.min(...validScores);
}

/**
 * 3️⃣ النتيجة النهائية (Final Status: ناجح/مكمل) - منطق وزاري
 * 
 * ⚠️ IMPORTANT: عمود النتيجة النهائية لا يعتمد على المعدل ولا على التقييم
 * وإنما يعتمد فقط على أدنى درجة حصل عليها الطالب في جميع المواد.
 * 
 * ============================================================
 * 🔹 منطق النتيجة النهائية
 * ============================================================
 * 
 * المنطق الصحيح:
 * 1. يتم فحص جميع درجات المواد الخاصة بالطالب
 * 2. يتم استخراج أدنى درجة (MIN) من درجات المواد
 * 3. قرار النتيجة النهائية:
 *    - إذا كانت أدنى درجة >= 50 → النتيجة النهائية = "ناجح"
 *    - إذا كانت أدنى درجة < 50 → النتيجة النهائية = "مكمل"
 * 
 * (مطابق لصيغة Excel):
 * =IF(MIN(درجات_المواد) >= 50, "ناجح", "مكمل")
 * 
 * أمثلة:
 * - درجات: [85, 75, 90, 45, 80] → أدنى درجة = 45 → "مكمل" (لأن 45 < 50)
 * - درجات: [85, 75, 90, 50, 80] → أدنى درجة = 50 → "ناجح" (لأن 50 >= 50)
 * - درجات: [85, 75, 90, 55, 80] → أدنى درجة = 55 → "ناجح" (لأن 55 >= 50)
 * 
 * Logic:
 * - final_score (MIN) >= 50 → "ناجح"
 * - final_score (MIN) < 50  → "مكمل"
 * 
 * ملاحظات إلزامية:
 * - لا يُنظر إلى المعدل إطلاقًا في هذا القرار
 * - لا يهم عدد المواد الراسبة، مادة واحدة أقل من 50 كافية لجعل النتيجة (مكمل)
 * - يجب تحديث النتيجة النهائية تلقائيًا عند تغيير أي درجة مادة
 * - لا يعتمد على التقييم (امتياز/جيد جداً/...)
 * - لا يعتمد على عدد الوحدات
 * - لا يعتمد على المجموع الكلي
 * 
 * ⚠️ IMPORTANT: Depends ONLY on MIN of subject scores (finalNumeric)
 * NOT on average, NOT on evaluation, NOT on total, NOT on units
 */
export function calculateFinalResult(finalNumeric: number | string | null | undefined): string {
  // Convert to number, default to 0 if invalid
  const safeFinalNumeric = Number(finalNumeric) || 0;
  
  // Apply ministerial logic: if MIN score >= 50 → "ناجح", else → "مكمل"
  // This decision is based ONLY on the minimum subject score, not on average
  // Formula: إذا أدنى درجة >= 50 → "ناجح"، وإلا → "مكمل"
  if (safeFinalNumeric >= 50) return "ناجح";
  return "مكمل";
}

/**
 * Get evaluation and final result from summary JSON and subjects JSON
 * This ensures we always use the correct ministerial logic
 * 
 * @param summaryJson The summary JSON object from database
 * @param subjectsJson Array of subjects with scores
 * @returns Object with evaluation (from average) and finalStatus (from MIN of scores)
 */
export function getFinalEvaluationAndResult(
  summaryJson: Record<string, unknown> | null | undefined,
  subjectsJson?: Array<{ score?: number | string | null }> | null | undefined
): {
  evaluation: string | null;
  finalStatus: string | null;
  finalNumeric: number | null;
} {
  if (!summaryJson || typeof summaryJson !== "object") {
    return { evaluation: null, finalStatus: null, finalNumeric: null };
  }

  // ⚠️ IMPORTANT: Always extract average from summaryJson
  // Support both "avg" and "average" keys
  const avg = summaryJson.avg ?? summaryJson.average;
  
  // ⚠️ CRITICAL: Evaluation MUST be calculated from average ONLY
  // NEVER read evaluation from summaryJson.evaluation (even if it exists)
  // Evaluation logic: same as grade calculation, but applied to average
  // - avg >= 90 → "امتياز"
  // - avg >= 80 → "جيد جداً"
  // - avg >= 70 → "جيد"
  // - avg >= 60 → "متوسط"
  // - avg >= 50 → "مقبول"
  // - avg < 50 → "راسب"
  let evaluation: string | null = null;
  if (avg !== undefined && avg !== null && avg !== "") {
    // Always calculate evaluation from average - NEVER from stored evaluation
    // Cast avg: summaryJson is Record<string, unknown> so avg is unknown
    evaluation = calculateFinalEvaluation(avg as number | string);
    
    // Debug logging (only in development)
    if (process.env.NODE_ENV === "development") {
      console.log(`[getFinalEvaluationAndResult] Evaluation Calculation:`);
      console.log(`  - المعدل (Average) = ${avg}`);
      console.log(`  - التقييم (Evaluation) = ${evaluation} (calculated from average)`);
      // Warn if summaryJson.evaluation exists but differs from calculated value
      if (summaryJson.evaluation && summaryJson.evaluation !== evaluation) {
        console.warn(`  - ⚠️ WARNING: summaryJson.evaluation exists (${summaryJson.evaluation}) but differs from calculated value (${evaluation})`);
        console.warn(`  - Using calculated value (${evaluation}) - this is correct behavior`);
      }
    }
  } else {
    // If average is missing, evaluation cannot be calculated
    if (process.env.NODE_ENV === "development") {
      console.warn(`[getFinalEvaluationAndResult] ⚠️ Cannot calculate evaluation: average is missing or invalid`);
      console.warn(`  - avg = ${avg}`);
      console.warn(`  - summaryJson keys: ${Object.keys(summaryJson).join(", ")}`);
    }
  }

  // Calculate finalNumeric from MIN of subject scores
  // IMPORTANT: Only use actual subjects (exclude "عدد الوحدات" which is NOT a subject)
  let finalNumeric: number | null = null;
  let finalStatus: string | null = null;
  
  if (subjectsJson && Array.isArray(subjectsJson) && subjectsJson.length > 0) {
    // Filter out "عدد الوحدات" - it's NOT a subject, it's metadata
    // عدد الوحدات لا يُستخدم في حساب النتيجة النهائية
    const actualSubjects = subjectsJson.filter((subject: any) => {
      const subjectName = String(subject.name || "").trim().toLowerCase();
      // Exclude any subject with "وحدات" or "units" in the name
      return !subjectName.includes("وحدات") && 
             !subjectName.includes("units") && 
             subjectName !== "عدد الوحدات" &&
             subjectName !== "units";
    });
    
    // Extract scores from actual subjects only
    const subjectScores = actualSubjects
      .map(subject => subject.score)
      .filter(score => score !== undefined && score !== null && score !== "");
    
    if (subjectScores.length > 0) {
      // Calculate MIN of all actual subject scores (excluding units)
      finalNumeric = calculateFinalNumeric(subjectScores);
      // Calculate finalStatus based on MIN score
      // Formula: إذا أدنى درجة >= 50 → "ناجح"، وإلا → "مكمل"
      finalStatus = calculateFinalResult(finalNumeric);
      
      // Debug logging (only in development)
      if (process.env.NODE_ENV === "development") {
        console.log(`[getFinalEvaluationAndResult] Final Status Calculation:`);
        console.log(`  - Total subjects: ${subjectsJson.length}, Actual subjects: ${actualSubjects.length}`);
        console.log(`  - Subject scores: [${subjectScores.join(", ")}]`);
        console.log(`  - أدنى درجة (MIN) = ${finalNumeric}`);
        console.log(`  - النتيجة النهائية = ${finalStatus} (based on MIN >= 50)`);
      }
    }
  }

  return { evaluation, finalStatus, finalNumeric };
}
