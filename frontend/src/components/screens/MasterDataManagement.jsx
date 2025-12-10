import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Database,
  Plus,
  Edit3,
  Trash2,
  X,
  Save,
  Settings,
  Award,
  Briefcase,
  Clock,
  Building2,
  Car,
  Shield,
  Calculator,
  Users,
  Store,
  FileText,
  Scale,
  Shield as Shield2,
  CheckSquare,
  Download,
  BookOpen,
  Home,
} from 'lucide-react'
import { MasterRepository } from '../../infrastructure/repositories/MasterRepository'
import { useTenant } from '../../contexts/TenantContext'
import DataImpactDocumentation from './DataImpactDocumentation'
import TimeInput from '../shared/TimeInput'

const masterRepository = new MasterRepository()

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 },
}

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.5,
}

const MasterDataManagement = ({ onPrev }) => {
  const navigate = useNavigate()
  const { tenantId } = useTenant()
  const [selectedMaster, setSelectedMaster] = useState('staff')
  const [masterData, setMasterData] = useState([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('create')
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({})
  const [error, setError] = useState(null)

  const [stores, setStores] = useState([])
  const [roles, setRoles] = useState([])
  const [divisions, setDivisions] = useState([])
  const [employmentTypes, setEmploymentTypes] = useState([])

  const masterTypes = [
    { id: 'staff', label: 'スタッフ', icon: Users },
    { id: 'stores', label: '店舗', icon: Store },
    { id: 'roles', label: '役職', icon: Settings },
    { id: 'skills', label: 'スキル', icon: Award },
    { id: 'employment_types', label: '雇用形態', icon: Briefcase },
    { id: 'shift_patterns', label: 'シフトパターン', icon: Clock },
    { id: 'divisions', label: '部署', icon: Building2 },
    { id: 'commute_allowance', label: '通勤手当', icon: Car },
    { id: 'insurance_rates', label: '保険料率', icon: Shield },
    { id: 'tax_brackets', label: '税率区分', icon: Calculator },
    { id: 'labor_law_constraints', label: '労働法制約', icon: Scale },
    { id: 'store_constraints', label: '店舗制約', icon: FileText },
    { id: 'labor_management_rules', label: '労務管理ルール', icon: CheckSquare },
    { id: 'shift_validation_rules', label: 'シフト検証ルール', icon: Shield2 },
    { id: 'impact_documentation', label: '影響範囲ドキュメント', icon: BookOpen, isSpecial: true },
  ]

  const loadMasterData = useCallback(async () => {
    // 影響範囲ドキュメントの場合はデータをロードしない
    if (selectedMaster === 'impact_documentation') {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      let data = []
      switch (selectedMaster) {
        case 'staff':
          data = await masterRepository.getStaff(tenantId)
          break
        case 'stores':
          data = await masterRepository.getStores(tenantId)
          break
        case 'roles':
          data = await masterRepository.getRoles(tenantId)
          break
        case 'skills':
          data = await masterRepository.getSkills(tenantId)
          break
        case 'employment_types':
          data = await masterRepository.getEmploymentTypes(tenantId)
          break
        case 'shift_patterns':
          data = await masterRepository.getShiftPatterns(tenantId)
          break
        case 'divisions':
          data = await masterRepository.getDivisions(tenantId)
          break
        case 'commute_allowance':
          data = await masterRepository.getCommuteAllowances(tenantId)
          break
        case 'insurance_rates':
          data = await masterRepository.getInsuranceRates(tenantId)
          break
        case 'tax_brackets':
          data = await masterRepository.getTaxBrackets(tenantId)
          break
        case 'labor_law_constraints':
          data = await masterRepository.getLaborLawConstraints(tenantId)
          break
        case 'store_constraints':
          data = await masterRepository.getStoreConstraints(tenantId)
          break
        case 'labor_management_rules':
          data = await masterRepository.getLaborManagementRules(tenantId)
          break
        case 'shift_validation_rules':
          data = await masterRepository.getShiftValidationRules(tenantId)
          break
        default:
          data = []
      }

      setMasterData(data)
    } catch (error) {
      console.error('マスターデータ取得エラー:', error)
      setError(`データの取得に失敗しました: ${error.message}`)
      setMasterData([])
    } finally {
      setLoading(false)
    }
  }, [selectedMaster, tenantId])

  useEffect(() => {
    loadMasterData()
  }, [loadMasterData])

  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        if (selectedMaster === 'staff' || selectedMaster === 'stores') {
          const [storesData, rolesData, divisionsData, employmentTypesData] = await Promise.all([
            masterRepository.getStores(tenantId),
            masterRepository.getRoles(tenantId),
            masterRepository.getDivisions(tenantId),
            masterRepository.getEmploymentTypes(tenantId),
          ])
          setStores(storesData)
          setRoles(rolesData)
          setDivisions(divisionsData)
          setEmploymentTypes(employmentTypesData)
        }
      } catch (error) {
        console.error('ドロップダウンデータ取得エラー:', error)
      }
    }

    loadDropdownData()
  }, [selectedMaster, tenantId])

  const handleCreate = () => {
    setModalMode('create')
    setEditingItem(null)

    switch (selectedMaster) {
      case 'staff':
        setFormData({
          tenant_id: tenantId,
          staff_code: '',
          name: '',
          email: '',
          phone_number: '',
          employment_type: '',
          hire_date: '',
          monthly_salary: '',
          hourly_rate: '',
          store_id: '',
          role_id: '',
          division_id: '',
          resignation_date: '',
        })
        break
      case 'stores':
        setFormData({
          tenant_id: tenantId,
          store_code: '',
          store_name: '',
          address: '',
          phone_number: '',
          business_hours_start: '',
          business_hours_end: '',
          division_id: '',
        })
        break
      case 'roles':
        setFormData({
          tenant_id: tenantId,
          role_code: '',
          role_name: '',
          description: '',
        })
        break
      case 'skills':
        setFormData({
          tenant_id: tenantId,
          skill_code: '',
          skill_name: '',
          description: '',
        })
        break
      case 'employment_types':
        setFormData({
          tenant_id: tenantId,
          employment_code: '',
          employment_name: '',
          payment_type: '',
        })
        break
      case 'shift_patterns':
        setFormData({
          tenant_id: tenantId,
          store_id: '',
          pattern_code: '',
          pattern_name: '',
          start_time: '',
          end_time: '',
          break_minutes: '',
        })
        break
      case 'divisions':
        setFormData({
          tenant_id: tenantId,
          division_code: '',
          division_name: '',
          division_type: '',
          parent_division_id: '',
          contact_email: '',
          contact_phone: '',
        })
        break
      case 'commute_allowance':
        setFormData({
          tenant_id: tenantId,
          distance_from_km: '',
          distance_to_km: '',
          allowance_amount: '',
          daily_allowance: '',
          monthly_max: '',
          description: '',
        })
        break
      case 'insurance_rates':
        setFormData({
          tenant_id: tenantId,
          insurance_type: '',
          employee_rate: '',
          employer_rate: '',
          effective_from: '',
          effective_to: '',
          rate_name: '',
        })
        break
      case 'tax_brackets':
        setFormData({
          tenant_id: tenantId,
          tax_type: '',
          income_from: '',
          income_to: '',
          tax_rate: '',
          deduction_amount: '',
          effective_from: '',
          effective_to: '',
          bracket_name: '',
        })
        break
      case 'labor_law_constraints':
        setFormData({
          tenant_id: tenantId,
          constraint_code: '',
          constraint_name: '',
          description: '',
          is_active: true,
        })
        break
      case 'store_constraints':
        setFormData({
          tenant_id: tenantId,
          constraint_code: '',
          constraint_name: '',
          description: '',
          is_active: true,
        })
        break
      case 'labor_management_rules':
        setFormData({
          tenant_id: tenantId,
          rule_code: '',
          rule_name: '',
          description: '',
          is_active: true,
        })
        break
      case 'shift_validation_rules':
        setFormData({
          tenant_id: tenantId,
          rule_code: '',
          rule_name: '',
          description: '',
          is_active: true,
        })
        break
      default:
        setFormData({})
    }

    setShowModal(true)
  }

  const handleEdit = item => {
    setModalMode('edit')
    setEditingItem(item)

    switch (selectedMaster) {
      case 'staff':
        setFormData({
          staff_code: item.staff_code,
          name: item.name,
          email: item.email || '',
          phone_number: item.phone_number || '',
          employment_type: item.employment_type || '',
          hire_date: item.hire_date || '',
          monthly_salary: item.monthly_salary || '',
          hourly_rate: item.hourly_rate || '',
          store_id: item.store_id || '',
          role_id: item.role_id || '',
          division_id: item.division_id || '',
          resignation_date: item.resignation_date || '',
        })
        break
      case 'stores':
        setFormData({
          store_code: item.store_code,
          store_name: item.store_name,
          address: item.address || '',
          phone_number: item.phone_number || '',
          business_hours_start: item.business_hours_start || '',
          business_hours_end: item.business_hours_end || '',
          division_id: item.division_id || '',
        })
        break
      case 'roles':
        setFormData({
          role_code: item.role_code,
          role_name: item.role_name,
          description: item.description || '',
        })
        break
      case 'skills':
        setFormData({
          skill_code: item.skill_code,
          skill_name: item.skill_name,
          description: item.description || '',
        })
        break
      case 'employment_types':
        setFormData({
          employment_code: item.employment_code,
          employment_name: item.employment_name,
          payment_type: item.payment_type || '',
        })
        break
      case 'shift_patterns':
        setFormData({
          store_id: item.store_id || '',
          pattern_code: item.pattern_code,
          pattern_name: item.pattern_name,
          start_time: item.start_time || '',
          end_time: item.end_time || '',
          break_minutes: item.break_minutes || '',
        })
        break
      case 'divisions':
        setFormData({
          division_code: item.division_code,
          division_name: item.division_name,
          division_type: item.division_type || '',
          parent_division_id: item.parent_division_id || '',
          contact_email: item.contact_email || '',
          contact_phone: item.contact_phone || '',
        })
        break
      case 'commute_allowance':
        setFormData({
          distance_from_km: item.distance_from_km,
          distance_to_km: item.distance_to_km,
          allowance_amount: item.allowance_amount,
          daily_allowance: item.daily_allowance || '',
          monthly_max: item.monthly_max || '',
          description: item.description || '',
        })
        break
      case 'insurance_rates':
        setFormData({
          insurance_type: item.insurance_type,
          employee_rate: item.employee_rate,
          employer_rate: item.employer_rate,
          effective_from: item.effective_from || '',
          effective_to: item.effective_to || '',
          rate_name: item.rate_name || '',
        })
        break
      case 'tax_brackets':
        setFormData({
          tax_type: item.tax_type,
          income_from: item.income_from,
          income_to: item.income_to || '',
          tax_rate: item.tax_rate,
          deduction_amount: item.deduction_amount || '',
          effective_from: item.effective_from || '',
          effective_to: item.effective_to || '',
          bracket_name: item.bracket_name || '',
        })
        break
      case 'labor_law_constraints':
        setFormData({
          constraint_code: item.constraint_code,
          constraint_name: item.constraint_name,
          description: item.description || '',
          is_active: item.is_active,
        })
        break
      case 'store_constraints':
        setFormData({
          constraint_code: item.constraint_code,
          constraint_name: item.constraint_name,
          description: item.description || '',
          is_active: item.is_active,
        })
        break
      case 'labor_management_rules':
        setFormData({
          rule_code: item.rule_code,
          rule_name: item.rule_name,
          description: item.description || '',
          is_active: item.is_active,
        })
        break
      case 'shift_validation_rules':
        setFormData({
          rule_code: item.rule_code,
          rule_name: item.rule_name,
          description: item.description || '',
          is_active: item.is_active,
        })
        break
      default:
        setFormData({})
    }

    setShowModal(true)
  }

  const handleDelete = async item => {
    const itemName = getItemDisplayName(item)
    if (
      !window.confirm(
        `「${itemName}」を削除してもよろしいですか？\n※論理削除されます（is_active = false）`
      )
    ) {
      return
    }

    try {
      setError(null)

      switch (selectedMaster) {
        case 'staff':
          await masterRepository.deleteStaff(item.staff_id)
          break
        case 'stores':
          await masterRepository.deleteStore(item.store_id)
          break
        case 'roles':
          await masterRepository.deleteRole(item.role_id)
          break
        case 'skills':
          await masterRepository.deleteSkill(item.skill_id)
          break
        case 'employment_types':
          await masterRepository.deleteEmploymentType(item.employment_type_id)
          break
        case 'shift_patterns':
          await masterRepository.deleteShiftPattern(item.pattern_id)
          break
        case 'divisions':
          await masterRepository.deleteDivision(item.division_id)
          break
        case 'commute_allowance':
          await masterRepository.deleteCommuteAllowance(item.allowance_id)
          break
        case 'insurance_rates':
          await masterRepository.deleteInsuranceRate(item.rate_id)
          break
        case 'tax_brackets':
          await masterRepository.deleteTaxBracket(item.bracket_id)
          break
        case 'labor_law_constraints':
          await masterRepository.deleteLaborLawConstraint(item.constraint_id)
          break
        case 'store_constraints':
          await masterRepository.deleteStoreConstraint(item.constraint_id)
          break
        case 'labor_management_rules':
          await masterRepository.deleteLaborManagementRule(item.rule_id)
          break
        case 'shift_validation_rules':
          await masterRepository.deleteShiftValidationRule(item.rule_id)
          break
        default:
          throw new Error('未対応のマスター種別です')
      }

      await loadMasterData()
      alert('削除しました')
    } catch (error) {
      console.error('削除エラー:', error)
      setError(`削除に失敗しました: ${error.message}`)
    }
  }

  const handleSave = async () => {
    try {
      setError(null)

      if (!validateForm()) {
        return
      }

      if (modalMode === 'create') {
        switch (selectedMaster) {
          case 'staff':
            await masterRepository.createStaff(formData)
            break
          case 'stores':
            await masterRepository.createStore(formData)
            break
          case 'roles':
            await masterRepository.createRole(formData)
            break
          case 'skills':
            await masterRepository.createSkill(formData)
            break
          case 'employment_types':
            await masterRepository.createEmploymentType(formData)
            break
          case 'shift_patterns':
            await masterRepository.createShiftPattern(formData)
            break
          case 'divisions':
            await masterRepository.createDivision(formData)
            break
          case 'commute_allowance':
            await masterRepository.createCommuteAllowance(formData)
            break
          case 'insurance_rates':
            await masterRepository.createInsuranceRate(formData)
            break
          case 'tax_brackets':
            await masterRepository.createTaxBracket(formData)
            break
          case 'labor_law_constraints':
            await masterRepository.createLaborLawConstraint(formData)
            break
          case 'store_constraints':
            await masterRepository.createStoreConstraint(formData)
            break
          case 'labor_management_rules':
            await masterRepository.createLaborManagementRule(formData)
            break
          case 'shift_validation_rules':
            await masterRepository.createShiftValidationRule(formData)
            break
          default:
            throw new Error('未対応のマスター種別です')
        }
        alert('作成しました')
      } else {
        switch (selectedMaster) {
          case 'staff':
            await masterRepository.updateStaff(editingItem.staff_id, formData)
            break
          case 'stores':
            await masterRepository.updateStore(editingItem.store_id, formData)
            break
          case 'roles':
            await masterRepository.updateRole(editingItem.role_id, formData)
            break
          case 'skills':
            await masterRepository.updateSkill(editingItem.skill_id, formData)
            break
          case 'employment_types':
            await masterRepository.updateEmploymentType(editingItem.employment_type_id, formData)
            break
          case 'shift_patterns':
            await masterRepository.updateShiftPattern(editingItem.pattern_id, formData)
            break
          case 'divisions':
            await masterRepository.updateDivision(editingItem.division_id, formData)
            break
          case 'commute_allowance':
            await masterRepository.updateCommuteAllowance(editingItem.allowance_id, formData)
            break
          case 'insurance_rates':
            await masterRepository.updateInsuranceRate(editingItem.rate_id, formData)
            break
          case 'tax_brackets':
            await masterRepository.updateTaxBracket(editingItem.bracket_id, formData)
            break
          case 'labor_law_constraints':
            await masterRepository.updateLaborLawConstraint(editingItem.constraint_id, formData)
            break
          case 'store_constraints':
            await masterRepository.updateStoreConstraint(editingItem.constraint_id, formData)
            break
          case 'labor_management_rules':
            await masterRepository.updateLaborManagementRule(editingItem.rule_id, formData)
            break
          case 'shift_validation_rules':
            await masterRepository.updateShiftValidationRule(editingItem.rule_id, formData)
            break
          default:
            throw new Error('未対応のマスター種別です')
        }
        alert('更新しました')
      }

      setShowModal(false)
      await loadMasterData()
    } catch (error) {
      console.error('保存エラー:', error)
      setError(`保存に失敗しました: ${error.message}`)
    }
  }

  const validateForm = () => {
    switch (selectedMaster) {
      case 'staff':
        if (!formData.staff_code || !formData.name) {
          setError('スタッフコードと氏名は必須です')
          return false
        }
        if (!formData.store_id || !formData.role_id) {
          setError('店舗と役職は必須です')
          return false
        }
        return true
      case 'stores':
        if (!formData.store_code || !formData.store_name) {
          setError('店舗コードと店舗名は必須です')
          return false
        }
        if (!formData.division_id) {
          setError('部署は必須です')
          return false
        }
        return true
      case 'roles':
        if (!formData.role_code || !formData.role_name) {
          setError('役職コードと役職名は必須です')
          return false
        }
        return true
      case 'skills':
        if (!formData.skill_code || !formData.skill_name) {
          setError('スキルコードとスキル名は必須です')
          return false
        }
        return true
      case 'employment_types':
        if (!formData.employment_code || !formData.employment_name) {
          setError('雇用形態コードと雇用形態名は必須です')
          return false
        }
        return true
      case 'shift_patterns':
        if (!formData.pattern_code || !formData.pattern_name) {
          setError('パターンコードとパターン名は必須です')
          return false
        }
        return true
      case 'divisions':
        if (!formData.division_code || !formData.division_name) {
          setError('部署コードと部署名は必須です')
          return false
        }
        return true
      case 'commute_allowance':
        if (!formData.distance_from_km || !formData.distance_to_km || !formData.allowance_amount) {
          setError('距離（開始）、距離（終了）、手当額は必須です')
          return false
        }
        return true
      case 'insurance_rates':
        if (!formData.insurance_type || !formData.employee_rate || !formData.employer_rate) {
          setError('保険種別、従業員負担率、雇用主負担率は必須です')
          return false
        }
        return true
      case 'tax_brackets':
        if (!formData.tax_type || !formData.income_from || !formData.tax_rate) {
          setError('税種別、所得（開始）、税率は必須です')
          return false
        }
        return true
      case 'labor_law_constraints':
        if (!formData.constraint_code || !formData.constraint_name) {
          setError('制約コードと制約名は必須です')
          return false
        }
        return true
      case 'store_constraints':
        if (!formData.constraint_code || !formData.constraint_name) {
          setError('制約コードと制約名は必須です')
          return false
        }
        return true
      case 'labor_management_rules':
        if (!formData.rule_code || !formData.rule_name) {
          setError('ルールコードとルール名は必須です')
          return false
        }
        return true
      case 'shift_validation_rules':
        if (!formData.rule_code || !formData.rule_name) {
          setError('ルールコードとルール名は必須です')
          return false
        }
        return true
      default:
        return true
    }
  }

  const getItemDisplayName = item => {
    switch (selectedMaster) {
      case 'staff':
        return item.name
      case 'stores':
        return item.store_name
      case 'roles':
        return item.role_name
      case 'skills':
        return item.skill_name
      case 'employment_types':
        return item.employment_name
      case 'shift_patterns':
        return item.pattern_name
      case 'divisions':
        return item.division_name
      case 'commute_allowance':
        return `${item.distance_from_km}-${item.distance_to_km}km: ¥${item.allowance_amount}`
      case 'insurance_rates':
        return item.rate_name || item.insurance_type
      case 'tax_brackets':
        return item.bracket_name || item.tax_type
      case 'labor_law_constraints':
        return item.constraint_name
      case 'store_constraints':
        return item.constraint_name
      case 'labor_management_rules':
        return item.rule_name
      case 'shift_validation_rules':
        return item.rule_name
      default:
        return 'アイテム'
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingItem(null)
    setFormData({})
    setError(null)
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const getTableColumns = () => {
    switch (selectedMaster) {
      case 'staff':
        return [
          { key: 'staff_id', label: 'ID', width: '80px' },
          { key: 'staff_code', label: 'スタッフコード', width: '150px' },
          { key: 'name', label: '氏名', width: '200px' },
          { key: 'store_id', label: '店舗ID', width: '100px' },
          { key: 'role_id', label: '役職ID', width: '100px' },
          { key: 'division_id', label: '部署ID', width: '100px' },
          { key: 'email', label: 'メールアドレス', width: '200px' },
          { key: 'phone_number', label: '電話番号', width: '150px' },
          { key: 'employment_type', label: '雇用形態', width: '120px' },
          { key: 'hire_date', label: '登録日', width: '120px' },
          { key: 'resignation_date', label: '退職日', width: '120px' },
          { key: 'is_active', label: '状態', width: '100px' },
        ]
      case 'stores':
        return [
          { key: 'store_id', label: 'ID', width: '80px' },
          { key: 'store_code', label: '店舗コード', width: '150px' },
          { key: 'store_name', label: '店舗名', width: '200px' },
          { key: 'division_id', label: '部署ID', width: '100px' },
          { key: 'address', label: '住所', width: '250px' },
          { key: 'phone_number', label: '電話番号', width: '150px' },
          { key: 'business_hours_start', label: '営業開始', width: '100px' },
          { key: 'business_hours_end', label: '営業終了', width: '100px' },
          { key: 'is_active', label: '状態', width: '100px' },
        ]
      case 'roles':
        return [
          { key: 'role_id', label: 'ID', width: '80px' },
          { key: 'role_code', label: '役職コード', width: '150px' },
          { key: 'role_name', label: '役職名', width: '200px' },
          { key: 'description', label: '説明', width: 'auto' },
          { key: 'is_active', label: '状態', width: '100px' },
        ]
      case 'skills':
        return [
          { key: 'skill_id', label: 'ID', width: '80px' },
          { key: 'skill_code', label: 'スキルコード', width: '150px' },
          { key: 'skill_name', label: 'スキル名', width: '200px' },
          { key: 'description', label: '説明', width: 'auto' },
          { key: 'is_active', label: '状態', width: '100px' },
        ]
      case 'employment_types':
        return [
          { key: 'employment_type_id', label: 'ID', width: '80px' },
          { key: 'employment_code', label: '雇用形態コード', width: '150px' },
          { key: 'employment_name', label: '雇用形態名', width: '200px' },
          { key: 'payment_type', label: '支払タイプ', width: '150px' },
          { key: 'is_active', label: '状態', width: '100px' },
        ]
      case 'shift_patterns':
        return [
          { key: 'pattern_id', label: 'ID', width: '80px' },
          { key: 'pattern_code', label: 'パターンコード', width: '150px' },
          { key: 'pattern_name', label: 'パターン名', width: '200px' },
          { key: 'start_time', label: '開始時刻', width: '100px' },
          { key: 'end_time', label: '終了時刻', width: '100px' },
          { key: 'break_minutes', label: '休憩(分)', width: '100px' },
          { key: 'is_active', label: '状態', width: '100px' },
        ]
      case 'divisions':
        return [
          { key: 'division_id', label: 'ID', width: '80px' },
          { key: 'division_code', label: '部署コード', width: '150px' },
          { key: 'division_name', label: '部署名', width: '200px' },
          { key: 'division_type', label: '部署種別', width: '150px' },
          { key: 'contact_email', label: '連絡先メール', width: '200px' },
          { key: 'contact_phone', label: '連絡先電話', width: '150px' },
          { key: 'is_active', label: '状態', width: '100px' },
        ]
      case 'commute_allowance':
        return [
          { key: 'allowance_id', label: 'ID', width: '80px' },
          { key: 'distance_from_km', label: '距離開始(km)', width: '120px' },
          { key: 'distance_to_km', label: '距離終了(km)', width: '120px' },
          { key: 'allowance_amount', label: '手当額', width: '120px' },
          { key: 'daily_allowance', label: '日額手当', width: '120px' },
          { key: 'monthly_max', label: '月額上限', width: '120px' },
          { key: 'is_active', label: '状態', width: '100px' },
        ]
      case 'insurance_rates':
        return [
          { key: 'rate_id', label: 'ID', width: '80px' },
          { key: 'insurance_type', label: '保険種別', width: '150px' },
          { key: 'rate_name', label: '料率名', width: '200px' },
          { key: 'employee_rate', label: '従業員負担率', width: '120px' },
          { key: 'employer_rate', label: '雇用主負担率', width: '120px' },
          { key: 'effective_from', label: '適用開始日', width: '120px' },
          { key: 'effective_to', label: '適用終了日', width: '120px' },
          { key: 'is_active', label: '状態', width: '100px' },
        ]
      case 'tax_brackets':
        return [
          { key: 'bracket_id', label: 'ID', width: '80px' },
          { key: 'tax_type', label: '税種別', width: '150px' },
          { key: 'bracket_name', label: '区分名', width: '200px' },
          { key: 'income_from', label: '所得開始', width: '120px' },
          { key: 'income_to', label: '所得終了', width: '120px' },
          { key: 'tax_rate', label: '税率', width: '100px' },
          { key: 'deduction_amount', label: '控除額', width: '120px' },
          { key: 'effective_from', label: '適用開始日', width: '120px' },
          { key: 'effective_to', label: '適用終了日', width: '120px' },
          { key: 'is_active', label: '状態', width: '100px' },
        ]
      case 'labor_law_constraints':
        return [
          { key: 'constraint_id', label: 'ID', width: '80px' },
          { key: 'constraint_code', label: '制約コード', width: '150px' },
          { key: 'constraint_name', label: '制約名', width: '200px' },
          { key: 'description', label: '説明', width: 'auto' },
          { key: 'is_active', label: '状態', width: '100px' },
        ]
      case 'store_constraints':
        return [
          { key: 'constraint_id', label: 'ID', width: '80px' },
          { key: 'constraint_code', label: '制約コード', width: '150px' },
          { key: 'constraint_name', label: '制約名', width: '200px' },
          { key: 'description', label: '説明', width: 'auto' },
          { key: 'is_active', label: '状態', width: '100px' },
        ]
      case 'labor_management_rules':
        return [
          { key: 'rule_id', label: 'ID', width: '80px' },
          { key: 'rule_code', label: 'ルールコード', width: '150px' },
          { key: 'rule_name', label: 'ルール名', width: '200px' },
          { key: 'description', label: '説明', width: 'auto' },
          { key: 'is_active', label: '状態', width: '100px' },
        ]
      case 'shift_validation_rules':
        return [
          { key: 'rule_id', label: 'ID', width: '80px' },
          { key: 'rule_code', label: 'ルールコード', width: '150px' },
          { key: 'rule_name', label: 'ルール名', width: '200px' },
          { key: 'description', label: '説明', width: 'auto' },
          { key: 'is_active', label: '状態', width: '100px' },
        ]
      default:
        return []
    }
  }

  const getFormFields = () => {
    switch (selectedMaster) {
      case 'staff':
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                スタッフコード <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.staff_code || ''}
                onChange={e => handleInputChange('staff_code', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: S001"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                氏名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={e => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: 山田太郎"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                店舗 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.store_id || ''}
                onChange={e => handleInputChange('store_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">選択してください</option>
                {stores.map(store => (
                  <option key={store.store_id} value={store.store_id}>
                    {store.store_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                役職 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.role_id || ''}
                onChange={e => handleInputChange('role_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">選択してください</option>
                {roles.map(role => (
                  <option key={role.role_id} value={role.role_id}>
                    {role.role_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">部署</label>
              <select
                value={formData.division_id || ''}
                onChange={e => handleInputChange('division_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">選択してください</option>
                {divisions.map(division => (
                  <option key={division.division_id} value={division.division_id}>
                    {division.division_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                メールアドレス
              </label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={e => handleInputChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: yamada@example.com"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">電話番号</label>
              <input
                type="tel"
                value={formData.phone_number || ''}
                onChange={e => handleInputChange('phone_number', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: 090-1234-5678"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">雇用形態</label>
              <select
                value={formData.employment_type || ''}
                onChange={e => handleInputChange('employment_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">選択してください</option>
                {employmentTypes.map(et => (
                  <option key={et.employment_type_id} value={et.employment_code}>
                    {et.employment_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">登録日</label>
              <input
                type="date"
                value={formData.hire_date || ''}
                onChange={e => handleInputChange('hire_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">退職日</label>
              <input
                type="date"
                value={formData.resignation_date || ''}
                onChange={e => handleInputChange('resignation_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">月額給与</label>
              <input
                type="number"
                step="0.01"
                value={formData.monthly_salary || ''}
                onChange={e => handleInputChange('monthly_salary', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: 250000"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">時給</label>
              <input
                type="number"
                step="0.01"
                value={formData.hourly_rate || ''}
                onChange={e => handleInputChange('hourly_rate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: 1200"
              />
            </div>
          </>
        )
      case 'stores':
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                店舗コード <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.store_code || ''}
                onChange={e => handleInputChange('store_code', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: ST001"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                店舗名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.store_name || ''}
                onChange={e => handleInputChange('store_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: 新宿店"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                部署 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.division_id || ''}
                onChange={e => handleInputChange('division_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">選択してください</option>
                {divisions.map(division => (
                  <option key={division.division_id} value={division.division_id}>
                    {division.division_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">住所</label>
              <input
                type="text"
                value={formData.address || ''}
                onChange={e => handleInputChange('address', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: 東京都新宿区..."
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">電話番号</label>
              <input
                type="tel"
                value={formData.phone_number || ''}
                onChange={e => handleInputChange('phone_number', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: 03-1234-5678"
              />
            </div>
            <div className="mb-4">
              <TimeInput
                value={formData.business_hours_start || ''}
                onChange={val => handleInputChange('business_hours_start', val)}
                label="営業開始時刻"
                minHour={5}
                maxHour={28}
                minuteStep={30}
              />
            </div>
            <div className="mb-4">
              <TimeInput
                value={formData.business_hours_end || ''}
                onChange={val => handleInputChange('business_hours_end', val)}
                label="営業終了時刻"
                minHour={5}
                maxHour={28}
                minuteStep={30}
              />
            </div>
          </>
        )
      case 'roles':
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                役職コード <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.role_code || ''}
                onChange={e => handleInputChange('role_code', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: MGR"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                役職名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.role_name || ''}
                onChange={e => handleInputChange('role_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: マネージャー"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">説明</label>
              <textarea
                value={formData.description || ''}
                onChange={e => handleInputChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="役職の説明を入力"
              />
            </div>
          </>
        )
      case 'skills':
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                スキルコード <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.skill_code || ''}
                onChange={e => handleInputChange('skill_code', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: CASH"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                スキル名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.skill_name || ''}
                onChange={e => handleInputChange('skill_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: レジ操作"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">説明</label>
              <textarea
                value={formData.description || ''}
                onChange={e => handleInputChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="スキルの説明を入力"
              />
            </div>
          </>
        )
      case 'employment_types':
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                雇用形態コード <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.employment_code || ''}
                onChange={e => handleInputChange('employment_code', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: PART_TIME"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                雇用形態名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.employment_name || ''}
                onChange={e => handleInputChange('employment_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: アルバイト"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">支払タイプ</label>
              <select
                value={formData.payment_type || ''}
                onChange={e => handleInputChange('payment_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">選択してください</option>
                <option value="HOURLY">時給制</option>
                <option value="MONTHLY">月給制</option>
                <option value="DAILY">日給制</option>
              </select>
            </div>
          </>
        )
      case 'shift_patterns':
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                パターンコード <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.pattern_code || ''}
                onChange={e => handleInputChange('pattern_code', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: MRN"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                パターン名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.pattern_name || ''}
                onChange={e => handleInputChange('pattern_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: 早番"
              />
            </div>
            <div className="mb-4">
              <TimeInput
                value={formData.start_time || ''}
                onChange={val => handleInputChange('start_time', val)}
                label="開始時刻"
                minHour={5}
                maxHour={28}
                minuteStep={15}
              />
            </div>
            <div className="mb-4">
              <TimeInput
                value={formData.end_time || ''}
                onChange={val => handleInputChange('end_time', val)}
                label="終了時刻"
                minHour={5}
                maxHour={28}
                minuteStep={15}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                休憩時間（分）
              </label>
              <input
                type="number"
                value={formData.break_minutes || ''}
                onChange={e => handleInputChange('break_minutes', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: 60"
              />
            </div>
          </>
        )
      case 'divisions':
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                部署コード <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.division_code || ''}
                onChange={e => handleInputChange('division_code', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: SALES"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                部署名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.division_name || ''}
                onChange={e => handleInputChange('division_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: 営業部"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">部署種別</label>
              <input
                type="text"
                value={formData.division_type || ''}
                onChange={e => handleInputChange('division_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: 営業"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">親部署ID</label>
              <input
                type="number"
                value={formData.parent_division_id || ''}
                onChange={e => handleInputChange('parent_division_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="上位部署がある場合に入力"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                連絡先メールアドレス
              </label>
              <input
                type="email"
                value={formData.contact_email || ''}
                onChange={e => handleInputChange('contact_email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: sales@example.com"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                連絡先電話番号
              </label>
              <input
                type="tel"
                value={formData.contact_phone || ''}
                onChange={e => handleInputChange('contact_phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: 03-1234-5678"
              />
            </div>
          </>
        )
      case 'commute_allowance':
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                距離開始（km） <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.distance_from_km || ''}
                onChange={e => handleInputChange('distance_from_km', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: 0"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                距離終了（km） <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.distance_to_km || ''}
                onChange={e => handleInputChange('distance_to_km', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: 5"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                手当額 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.allowance_amount || ''}
                onChange={e => handleInputChange('allowance_amount', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: 5000"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">日額手当</label>
              <input
                type="number"
                step="0.01"
                value={formData.daily_allowance || ''}
                onChange={e => handleInputChange('daily_allowance', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: 500"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">月額上限</label>
              <input
                type="number"
                step="0.01"
                value={formData.monthly_max || ''}
                onChange={e => handleInputChange('monthly_max', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: 15000"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">説明</label>
              <textarea
                value={formData.description || ''}
                onChange={e => handleInputChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="通勤手当の説明を入力"
              />
            </div>
          </>
        )
      case 'insurance_rates':
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                保険種別 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.insurance_type || ''}
                onChange={e => handleInputChange('insurance_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: 健康保険"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">料率名</label>
              <input
                type="text"
                value={formData.rate_name || ''}
                onChange={e => handleInputChange('rate_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: 2024年度健康保険料率"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                従業員負担率 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.0001"
                value={formData.employee_rate || ''}
                onChange={e => handleInputChange('employee_rate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: 0.05"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                雇用主負担率 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.0001"
                value={formData.employer_rate || ''}
                onChange={e => handleInputChange('employer_rate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: 0.05"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">適用開始日</label>
              <input
                type="date"
                value={formData.effective_from || ''}
                onChange={e => handleInputChange('effective_from', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">適用終了日</label>
              <input
                type="date"
                value={formData.effective_to || ''}
                onChange={e => handleInputChange('effective_to', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </>
        )
      case 'tax_brackets':
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                税種別 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.tax_type || ''}
                onChange={e => handleInputChange('tax_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: 所得税"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">区分名</label>
              <input
                type="text"
                value={formData.bracket_name || ''}
                onChange={e => handleInputChange('bracket_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: 195万円以下"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                所得開始 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.income_from || ''}
                onChange={e => handleInputChange('income_from', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: 0"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">所得終了</label>
              <input
                type="number"
                step="0.01"
                value={formData.income_to || ''}
                onChange={e => handleInputChange('income_to', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: 1950000"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                税率 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.0001"
                value={formData.tax_rate || ''}
                onChange={e => handleInputChange('tax_rate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: 0.05"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">控除額</label>
              <input
                type="number"
                step="0.01"
                value={formData.deduction_amount || ''}
                onChange={e => handleInputChange('deduction_amount', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: 0"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">適用開始日</label>
              <input
                type="date"
                value={formData.effective_from || ''}
                onChange={e => handleInputChange('effective_from', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">適用終了日</label>
              <input
                type="date"
                value={formData.effective_to || ''}
                onChange={e => handleInputChange('effective_to', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </>
        )
      case 'labor_law_constraints':
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                制約コード <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.constraint_code || ''}
                onChange={e => handleInputChange('constraint_code', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: LLC001"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                制約名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.constraint_name || ''}
                onChange={e => handleInputChange('constraint_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: 週40時間制限"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">説明</label>
              <textarea
                value={formData.description || ''}
                onChange={e => handleInputChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="制約の説明を入力"
              />
            </div>
          </>
        )
      case 'store_constraints':
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                制約コード <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.constraint_code || ''}
                onChange={e => handleInputChange('constraint_code', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: SC001"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                制約名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.constraint_name || ''}
                onChange={e => handleInputChange('constraint_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: 最小配置人数"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">説明</label>
              <textarea
                value={formData.description || ''}
                onChange={e => handleInputChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="制約の説明を入力"
              />
            </div>
          </>
        )
      case 'labor_management_rules':
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ルールコード <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.rule_code || ''}
                onChange={e => handleInputChange('rule_code', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: LMR001"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ルール名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.rule_name || ''}
                onChange={e => handleInputChange('rule_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: 連続勤務日数上限"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">説明</label>
              <textarea
                value={formData.description || ''}
                onChange={e => handleInputChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="ルールの説明を入力"
              />
            </div>
          </>
        )
      case 'shift_validation_rules':
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ルールコード <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.rule_code || ''}
                onChange={e => handleInputChange('rule_code', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: SVR001"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ルール名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.rule_name || ''}
                onChange={e => handleInputChange('rule_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: 勤務間インターバル"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">説明</label>
              <textarea
                value={formData.description || ''}
                onChange={e => handleInputChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="ルールの説明を入力"
              />
            </div>
          </>
        )
      default:
        return <div>フォームが定義されていません</div>
    }
  }

  const getCellValue = (item, column) => {
    const value = item[column.key]

    if (column.key === 'is_active') {
      return value ? (
        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
          有効
        </span>
      ) : (
        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
          無効
        </span>
      )
    }

    // 雇用形態を日本語名に変換（マスタデータから）
    if (column.key === 'employment_type') {
      const employmentType = employmentTypes.find(et => et.employment_code === value)
      return employmentType ? employmentType.employment_name : value || '-'
    }

    // 役職IDを役職名に変換
    if (column.key === 'role_id') {
      const role = roles.find(r => r.role_id === value)
      return role ? role.role_name : value || '-'
    }

    // 店舗IDを店舗名に変換
    if (column.key === 'store_id') {
      const store = stores.find(s => s.store_id === value)
      return store ? store.store_name : value || '-'
    }

    // 部署IDを部署名に変換
    if (column.key === 'division_id') {
      const division = divisions.find(d => d.division_id === value)
      return division ? division.division_name : value || '-'
    }

    return value || '-'
  }

  const selectedMasterType = masterTypes.find(t => t.id === selectedMaster)

  return (
    <div className="min-h-screen bg-slate-50 pt-16">
      <motion.div
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className="max-w-[1800px] mx-auto px-4"
      >
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Home className="h-4 w-4" />
            ダッシュボード
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">マスターデータ管理</h1>
            <p className="text-sm text-gray-600">各種マスターデータの閲覧・編集</p>
          </div>
        </div>

        <div className="flex gap-4 h-[calc(100vh-180px)]">
          {/* 左エリア: マスター種別リスト */}
          <div className="w-[200px] flex-shrink-0 bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-blue-500 border-b border-blue-700">
              <div className="flex items-center gap-2 text-white">
                <Database className="h-4 w-4" />
                <h2 className="font-semibold text-sm">マスター種別</h2>
              </div>
            </div>
            <div className="overflow-y-auto h-[calc(100%-50px)]">
              {masterTypes.map(type => {
                const Icon = type.icon
                return (
                  <button
                    key={type.id}
                    onClick={() => setSelectedMaster(type.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm transition-colors border-b border-gray-100 ${
                      selectedMaster === type.id
                        ? 'bg-blue-50 text-blue-700 border-l-4 border-l-blue-600'
                        : 'text-gray-700 hover:bg-gray-50 border-l-4 border-l-transparent'
                    }`}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="font-medium text-left truncate">{type.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 右エリア: データ表示 */}
          <div className="flex-1 bg-white rounded-lg shadow-md border border-gray-200 flex flex-col overflow-hidden">
            {selectedMaster === 'impact_documentation' ? (
              /* 影響範囲ドキュメント */
              <div className="h-full overflow-auto">
                <DataImpactDocumentation onPrev={onPrev} />
              </div>
            ) : (
              <>
                {/* ヘッダー */}
                <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {selectedMasterType && (
                        <>
                          {React.createElement(selectedMasterType.icon, {
                            className: 'h-6 w-6 text-blue-600',
                          })}
                          <div>
                            <h2 className="text-lg font-bold text-gray-900">
                              {selectedMasterType.label}
                            </h2>
                            <p className="text-xs text-gray-600">{masterData.length}件のデータ</p>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {}}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                      >
                        <Download className="h-4 w-4" />
                        エクスポート
                      </button>
                      <button
                        onClick={handleCreate}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        新規追加
                      </button>
                    </div>
                  </div>
                </div>

                {/* エラー表示 */}
                {error && (
                  <div className="mx-5 mt-4 p-3 bg-red-50 border border-red-200 rounded">
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                )}

                {/* データテーブル */}
                <div className="flex-1 overflow-auto">
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-600">読み込み中...</p>
                    </div>
                  ) : masterData.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-600">データがありません</p>
                    </div>
                  ) : (
                    <table className="w-full border-collapse">
                      <thead className="bg-gray-100 sticky top-0 z-10">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-b border-gray-300 whitespace-nowrap">
                            No.
                          </th>
                          {getTableColumns().map(column => (
                            <th
                              key={column.key}
                              className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-b border-gray-300 whitespace-nowrap"
                              style={{ minWidth: column.width }}
                            >
                              {column.label}
                            </th>
                          ))}
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 border-b border-gray-300 whitespace-nowrap">
                            操作
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {masterData.map((item, index) => (
                          <tr
                            key={index}
                            className="hover:bg-blue-50 transition-colors border-b border-gray-200"
                          >
                            <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                              {index + 1}
                            </td>
                            {getTableColumns().map(column => (
                              <td
                                key={column.key}
                                className="px-4 py-3 text-sm text-gray-800 whitespace-nowrap"
                              >
                                {getCellValue(item, column)}
                              </td>
                            ))}
                            <td className="px-4 py-3 text-sm whitespace-nowrap">
                              <div className="flex justify-center gap-2">
                                <button
                                  onClick={() => handleEdit(item)}
                                  className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors"
                                  title="編集"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(item)}
                                  className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
                                  title="削除"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* モーダル */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between p-5 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">
                  {modalMode === 'create' ? '新規作成' : '編集'}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5">
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                )}

                {getFormFields()}
              </div>

              <div className="flex justify-end gap-3 p-5 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                >
                  <Save className="h-4 w-4" />
                  保存
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default MasterDataManagement
