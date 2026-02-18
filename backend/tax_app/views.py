"""
API views for Municipal Tax System
"""
from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.db.models import Sum, Count, Q
from django.utils import timezone

from .models import User, TaxpayerProfile, TaxType, TaxAccount, PaymentRequest
from .serializers import (
    UserSerializer, TaxpayerProfileSerializer, TaxpayerProfileCreateSerializer,
    TaxTypeSerializer, TaxAccountSerializer, PaymentRequestSerializer,
    PaymentRequestCreateSerializer, LoginSerializer, DashboardSummarySerializer,
    AdminMetricsSerializer
)
from .permissions import IsAdministrator, IsTaxpayer, IsOwnerOrAdministrator, CanAccessAdmin


class TaxAccountViewSet(viewsets.ModelViewSet):
    """Tax account endpoints"""
    
    serializer_class = TaxAccountSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.role == 'Administrator':
            return TaxAccount.objects.all()
        return TaxAccount.objects.filter(user=self.request.user)


class RegisterView(generics.CreateAPIView):
    """Registration endpoint for taxpayers"""
    
    serializer_class = TaxpayerProfileCreateSerializer
    permission_classes = [AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profile = serializer.save()
        
        # Generate tokens
        user = profile.user
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'message': 'Registration successful',
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """Login endpoint"""
    
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        
        # Update last login
        user.update_last_login()
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'message': 'Login successful',
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_200_OK)


class RefreshTokenView(APIView):
    """Refresh token endpoint"""
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        refresh_token = request.data.get('refresh')
        
        try:
            refresh = RefreshToken(refresh_token)
            return Response({
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': 'Invalid refresh token'}, status=status.HTTP_400_BAD_REQUEST)


class MeView(APIView):
    """Get current user info"""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        data = UserSerializer(user).data
        
        # Add profile data if taxpayer
        if user.role == 'Taxpayer':
            try:
                profile = user.profile
                data['profile'] = TaxpayerProfileSerializer(profile).data
            except TaxpayerProfile.DoesNotExist:
                pass
        
        return Response(data, status=status.HTTP_200_OK)


class ProfileView(generics.RetrieveUpdateAPIView):
    """Get and update taxpayer profile"""
    
    serializer_class = TaxpayerProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        try:
            return self.request.user.profile
        except TaxpayerProfile.DoesNotExist:
            return None
    
    def update(self, request, *args, **kwargs):
        profile = self.get_object()
        if not profile:
            return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Don't allow updating system fields
        data = request.data.copy()
        data.pop('registration_date', None)
        data.pop('user', None)
        
        serializer = self.get_serializer(profile, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response(serializer.data, status=status.HTTP_200_OK)


class DashboardSummaryView(APIView):
    """Get taxpayer dashboard summary"""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        try:
            tax_account = user.tax_account
        except TaxAccount.DoesNotExist:
            return Response({
                'total_tax_due': 0,
                'paid_amount': 0,
                'outstanding_balance': 0,
                'next_payment_due_date': None,
                'status': 'Active'
            }, status=status.HTTP_200_OK)
        
        data = {
            'total_tax_due': tax_account.total_tax_due,
            'paid_amount': tax_account.paid_amount,
            'outstanding_balance': tax_account.outstanding_balance,
            'next_payment_due_date': tax_account.next_payment_due_date,
            'status': tax_account.status
        }
        
        serializer = DashboardSummarySerializer(data)
        return Response(serializer.data, status=status.HTTP_200_OK)


class PaymentRequestViewSet(viewsets.ModelViewSet):
    """Payment request endpoints"""
    
    serializer_class = PaymentRequestSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.role == 'Administrator':
            return PaymentRequest.objects.all().order_by('-created_at')
        return PaymentRequest.objects.filter(user=self.request.user).order_by('-created_at')
    
    def create(self, request, *args, **kwargs):
        serializer = PaymentRequestCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Get tax account
        tax_account_id = serializer.validated_data['tax_account']
        try:
            tax_account = TaxAccount.objects.get(id=tax_account_id, user=request.user)
        except TaxAccount.DoesNotExist:
            return Response({'error': 'Tax account not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Create payment request
        payment = PaymentRequest.objects.create(
            user=request.user,
            tax_account=tax_account,
            amount=serializer.validated_data['amount'],
            payment_method=serializer.validated_data['payment_method']
        )
        
        # Generate control number if selected
        if serializer.validated_data['payment_method'] == 'Generate Control Number':
            control_number = payment.generate_control_number()
            return Response({
                'message': 'Payment request created',
                'payment': PaymentRequestSerializer(payment).data,
                'control_number': control_number
            }, status=status.HTTP_201_CREATED)
        
        # Simulate provider reference
        import random
        payment.provider_reference = f"REF{random.randint(100000, 999999)}"
        payment.save()
        
        return Response({
            'message': 'Payment request created',
            'payment': PaymentRequestSerializer(payment).data
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def mark_paid(self, request, pk=None):
        """Mark payment as paid (for demo purposes)"""
        payment = self.get_object()
        
        # Only admin or owner can mark as paid
        if payment.user != request.user and request.user.role != 'Administrator':
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        payment.mark_as_paid()
        
        return Response({
            'message': 'Payment marked as paid',
            'payment': PaymentRequestSerializer(payment).data
        }, status=status.HTTP_200_OK)


class AdminMetricsView(APIView):
    """Admin dashboard metrics"""
    
    permission_classes = [IsAuthenticated, CanAccessAdmin]
    
    def get(self, request):
        # Total taxpayers
        total_taxpayers = User.objects.filter(role='Taxpayer').count()
        
        # Total properties/businesses
        total_properties = TaxpayerProfile.objects.filter(
            taxpayer_type__in=['Business', 'Organization']
        ).count()
        
        # Total tax assessed
        total_tax_assessed = TaxAccount.objects.aggregate(
            total=Sum('total_tax_due')
        )['total'] or 0
        
        # Total revenue collected
        total_revenue = PaymentRequest.objects.filter(
            status='Completed'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        # Outstanding tax
        outstanding = TaxAccount.objects.aggregate(
            total=Sum('outstanding_balance')
        )['total'] or 0
        
        # Overdue accounts
        overdue_accounts = TaxAccount.objects.filter(
            Q(status='Overdue') | Q(outstanding_balance__gt=0)
        ).count()
        
        data = {
            'total_registered_taxpayers': total_taxpayers,
            'total_properties_businesses': total_properties,
            'total_tax_assessed': total_tax_assessed,
            'total_revenue_collected': total_revenue,
            'outstanding_tax_amount': outstanding,
            'overdue_accounts': overdue_accounts
        }
        
        serializer = AdminMetricsSerializer(data)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminUserListView(generics.ListAPIView):
    """List all users (admin only)"""
    
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, CanAccessAdmin]
    queryset = User.objects.all().order_by('-date_joined')
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by role
        role = self.request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role)
        
        # Search by email or name
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(email__icontains=search) |
                Q(profile__first_name__icontains=search) |
                Q(profile__last_name__icontains=search)
            )
        
        return queryset


class AdminUnpaidUsersView(generics.ListAPIView):
    """List unpaid users for printing"""
    
    serializer_class = TaxAccountSerializer
    permission_classes = [IsAuthenticated, CanAccessAdmin]
    
    def get_queryset(self):
        return TaxAccount.objects.filter(
            Q(outstanding_balance__gt=0) | Q(status='Overdue')
        ).order_by('-outstanding_balance')


class TaxTypeViewSet(viewsets.ModelViewSet):
    """Tax type CRUD - Read access for all authenticated users, write only for admin"""
    
    serializer_class = TaxTypeSerializer
    permission_classes = [IsAuthenticated]
    queryset = TaxType.objects.all()
